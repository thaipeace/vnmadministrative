import { ProcessedLocationData, CropData, StageData, MedicineData, SheetResult } from "../types/sheet-data";

export function parseGoogleSheetResponse(values: string[][]): SheetResult {
  if (!values || values.length < 4) return { locations: [], productCatalog: {} };

  const row0 = values[0]; // Crop
  const row1 = values[1]; // Stage
  const row2 = values[2]; // Image
  const row3 = values[3]; // Medicine / Header

  const METADATA_LABELS = {
    AREA: "Diện tích thực tế",
    OPPORTUNITY: "Cơ hội thị trường"
  };

  // 1. Build a global product catalog (Medicine Name -> Image URL)
  const productCatalog: Record<string, string> = {};
  for (let i = 4; i < Math.max(row2.length, row3.length); i++) {
    const medName = (row3[i] || "").trim();
    const imgUrl = (row2[i] || "").trim();

    // Only catalog real products, not metadata headers
    if (medName && medName !== METADATA_LABELS.AREA && medName !== METADATA_LABELS.OPPORTUNITY && medName !== "Cây" && medName !== "Tỉnh" && medName !== "Xã") {
      if (imgUrl && imgUrl !== "0") {
        if (!productCatalog[medName] || productCatalog[medName] === "0") {
          productCatalog[medName] = imgUrl;
        }
      }
    }
  }

  const normalize = (s: string) => {
    let trimmed = s.trim().replace(/\s+/g, " ");
    if (!trimmed || trimmed.toLowerCase() === "(blank)") return "";
    // Remove "Total" from the name for grouping, but keep track of it if needed
    trimmed = trimmed.replace(/ total/i, "");
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // 2. Pre-process columns to understand the structure
  const colMappings: {
    colIndex: number;
    cropName: string;
    stageName: string;
    medicineName: string;
    isCropTotal: boolean;
    isStageTotal: boolean;
    isArea: boolean;
    isOpportunity: boolean;
  }[] = [];

  let currentCropRaw = "";
  let currentStageRaw = "";

  for (let i = 4; i < Math.max(row0.length, row3.length); i++) {
    const cropCell = row0[i];
    const stageCell = row1[i];
    const medicineName = (row3[i] || "").trim();

    if (cropCell && cropCell !== "Cây") {
      currentCropRaw = cropCell;
    }
    // Note: Stage can change even if Crop doesn't. 
    // If stageCell is provided, it's a new or continuing stage name.
    if (stageCell) {
      currentStageRaw = stageCell;
    }

    const isCropTotal = currentCropRaw.toLowerCase().includes("total");
    const isStageTotal = currentStageRaw.toLowerCase().includes("total");

    colMappings.push({
      colIndex: i,
      cropName: normalize(currentCropRaw),
      stageName: normalize(currentStageRaw),
      medicineName,
      isCropTotal,
      isStageTotal,
      isArea: medicineName === METADATA_LABELS.AREA,
      isOpportunity: medicineName === METADATA_LABELS.OPPORTUNITY
    });
  }

  // 3. Parse data rows
  const dataRows = values.slice(4);
  const locations: ProcessedLocationData[] = dataRows.map(row => {
    const province = row[0] || "";
    const ward = row[1] || "";
    const totalArea = row[2] || "0";
    const opportunity = row[3] || "0";

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

      // Handle Crop Total
      if (mapping.isCropTotal) {
        if (mapping.isArea) crop.totalArea = value;
        if (mapping.isOpportunity) crop.opportunity = value;
        return;
      }

      // Find or create stage
      let stage = crop.stages.find(s => s.name === mapping.stageName);
      if (!stage) {
        stage = {
          name: mapping.stageName,
          medicines: [],
          totalArea: "0",
          opportunity: "0"
        };
        crop.stages.push(stage);
      }

      // Handle Stage Total / Metadata
      if (mapping.isStageTotal) {
        if (mapping.isArea) stage.totalArea = value;
        if (mapping.isOpportunity) stage.opportunity = value;
        // Optimization: "Stage Total" columns usually don't have medicines in row 3, 
        // but if they do (like an actual product), it will fall through.
      }

      // Add as medicine if it's not a metadata column
      if (!mapping.isArea && !mapping.isOpportunity) {
        stage.medicines.push({
          name: mapping.medicineName,
          value: value,
          imageUrl: productCatalog[mapping.medicineName] || "0"
        });
      }
    });

    return {
      province,
      ward,
      totalArea,
      opportunity,
      crops: Array.from(cropsMap.values()).filter(c => c.stages.length > 0 || c.totalArea !== "0")
    };
  });

  return { locations, productCatalog };
}
