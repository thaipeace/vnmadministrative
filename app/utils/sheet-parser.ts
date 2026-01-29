import { ProcessedLocationData, CropData, StageData, MedicineData, SheetResult, ProductInfo } from "../types/sheet-data";

export function parseGoogleSheetResponse(values: string[][], productValues: string[][]): SheetResult {
  if (!values || values.length < 4) return { locations: [], productCatalog: {} };

  const row0 = values[0]; // Crop
  const row1 = values[1]; // Stage
  const row2 = values[2]; // Dịch hại
  const row3 = values[3]; // Medicine / Header

  const METADATA_LABELS = {
    AREA: "Diện tích thực tế",
    OPPORTUNITY: "Cơ hội thị trường"
  };

  // 1. Build a global product catalog from productValues (Excel "Products" sheet)
  const productCatalog: Record<string, ProductInfo> = {};
  if (productValues && productValues.length > 1) {
    for (let i = 1; i < productValues.length; i++) {
      const row = productValues[i];
      const name = (row[0] || "").trim();
      const imageLegacy = (row[1] || "").trim(); // Column B
      const imageNew = (row[2] || "").trim();    // Column C (ImageURL)
      const price = (row[3] || "").trim();       // Column D (Price)

      if (name) {
        // Prioritize new ImageURL field, fallback to legacy Image column
        const finalImage = imageNew && imageNew !== "0" ? imageNew : imageLegacy;
        productCatalog[name] = { image: finalImage || "0", price: price || "0" };
      }
    }
  }

  // Fallback: If image not in catalog, check Row 2/3 of final sheet for legacy support or missed items
  // (Wait, Row 2 is now Pests, so we shouldn't hunt for images there unless they are URLs)

  const normalize = (s: string) => {
    let trimmed = s.trim().replace(/\s+/g, " ");
    if (!trimmed || trimmed.toLowerCase() === "(blank)") return "";
    trimmed = trimmed.replace(/ total/i, "");
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // 2. Pre-process columns to understand the structure
  const colMappings: {
    colIndex: number;
    cropName: string;
    stageName: string;
    pestName: string;
    medicineName: string;
    isCropTotal: boolean;
    isStageTotal: boolean;
    isArea: boolean;
    isOpportunity: boolean;
  }[] = [];

  let currentCropRaw = "";
  let currentStageRaw = "";

  for (let i = 4; i < Math.max(row0.length, row3.length); i++) {
    const cropCell = (row0[i] || "").trim();
    const stageCell = (row1[i] || "").trim();
    const pestName = (row2[i] || "").trim();
    const medicineName = (row3[i] || "").trim();

    if (cropCell && cropCell !== "Cây") {
      currentCropRaw = cropCell;
    }
    if (stageCell) {
      currentStageRaw = stageCell;
    }

    const medLower = medicineName.toLowerCase();
    const isExplicitArea = medLower === METADATA_LABELS.AREA.toLowerCase() || medLower.includes("diện tích");
    const isExplicitOpportunity = medLower === METADATA_LABELS.OPPORTUNITY.toLowerCase() || medLower.includes("cơ hội");

    const isCropTotal = currentCropRaw.toLowerCase().includes("total");
    const isStageTotal = currentStageRaw.toLowerCase().includes("total");

    // Robust detection: If it's a Total column and Row 3 is blank, default to Area
    // unless it explicitly says Opportunity.
    const isOpportunity = isExplicitOpportunity || (isStageTotal && medLower.includes("cơ hội"));
    const isArea = isExplicitArea || ((isCropTotal || isStageTotal) && !isOpportunity && (!medicineName || medLower.includes("diện tích")));

    colMappings.push({
      colIndex: i,
      cropName: normalize(currentCropRaw),
      stageName: normalize(currentStageRaw),
      pestName: pestName,
      medicineName,
      isCropTotal,
      isStageTotal,
      isArea,
      isOpportunity
    });
  }

  // 3. Parse data rows
  const dataRows = values.slice(4);

  // Map to store Province level metadata (Key: Province Name)
  const provinceTotalAreaMap: Record<string, string> = {};
  const provinceTotalOpportunityMap: Record<string, string> = {};

  dataRows.forEach(row => {
    const provinceRaw = (row[0] || "").trim();
    const wardRaw = (row[1] || "").trim();
    const wardRawLower = wardRaw.toLowerCase();

    // 1. Check Column A for "Province Total" (e.g. "An Giang Total")
    if (provinceRaw.toLowerCase().endsWith("total")) {
      const provinceName = provinceRaw.substring(0, provinceRaw.length - 5).trim();
      provinceTotalAreaMap[provinceName] = row[2] || "0";
      provinceTotalOpportunityMap[provinceName] = row[3] || "0";
    }

    // 2. Check Column B for "Total"
    if (wardRawLower === "total") {
      provinceTotalAreaMap[provinceRaw] = row[2] || "0";
      provinceTotalOpportunityMap[provinceRaw] = row[3] || "0";
    }
  });

  const locations: ProcessedLocationData[] = dataRows.map(row => {
    const provinceRaw = (row[0] || "").trim();
    const wardRaw = (row[1] || "").trim();
    const wardRawLower = wardRaw.toLowerCase();

    // Skip "Total" rows from becoming separate entries in the list
    if (provinceRaw.toLowerCase().endsWith("total") || wardRawLower === "total") return null;

    const isProvinceLevel = wardRawLower === "all" || !wardRaw;
    const provinceName = provinceRaw;
    const wardName = isProvinceLevel ? "All" : wardRaw;

    // Resolve Area and Opportunity for Province level
    let totalArea = row[2] || "0";
    let opportunity = row[3] || "0";

    if (isProvinceLevel) {
      // Use values from "Total" summary rows if they exist, otherwise keep original
      totalArea = provinceTotalAreaMap[provinceName] || totalArea;
      opportunity = provinceTotalOpportunityMap[provinceName] || opportunity;
    }

    const cropsMap: Map<string, CropData> = new Map();

    colMappings.forEach(mapping => {
      const value = (row[mapping.colIndex] || "").trim();
      if (!value || value === "0") return;

      let crop = cropsMap.get(mapping.cropName);
      if (!crop) {
        crop = {
          name: mapping.cropName,
          totalArea: "0",
          stages: []
        };
        cropsMap.set(mapping.cropName, crop);
      }

      if (mapping.isCropTotal) {
        if (mapping.isArea) crop.totalArea = value;
        if (mapping.isOpportunity) crop.opportunity = value;
        return;
      }

      let stage = crop.stages.find(s => s.name === mapping.stageName);
      if (!stage) {
        stage = {
          name: mapping.stageName,
          medicines: [],
          totalArea: "0",
          opportunity: "0",
          pests: []
        };
        crop.stages.push(stage);
      }

      if (mapping.isStageTotal) {
        if (mapping.isArea) stage.totalArea = value;
        if (mapping.isOpportunity) stage.opportunity = value;
      }

      // Add solution/medicine if not metadata
      if (!mapping.isArea && !mapping.isOpportunity) {
        // Collect pests for the stage
        if (mapping.pestName && !stage.pests.includes(mapping.pestName)) {
          stage.pests.push(mapping.pestName);
        }

        stage.medicines.push({
          name: mapping.medicineName,
          value: value,
          pest: mapping.pestName,
          imageUrl: productCatalog[mapping.medicineName]?.image || "0"
        });
      }
    });

    return {
      province: provinceName,
      ward: wardName,
      totalArea,
      opportunity,
      crops: Array.from(cropsMap.values()).filter(c => c.stages.length > 0 || c.totalArea !== "0")
    };
  }).filter(Boolean) as ProcessedLocationData[];

  return { locations, productCatalog };
}
