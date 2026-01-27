export interface MedicineData {
    name: string;
    value: string;
    imageUrl?: string;
}

export interface StageData {
    name: string;
    medicines: MedicineData[];
    totalArea?: string;
    opportunity?: string;
}

export interface CropData {
    name: string;
    totalArea: string;
    opportunity?: string;
    stages: StageData[];
}

export interface ProcessedLocationData {
    province: string;
    ward: string;
    totalArea: string;
    opportunity: string;
    crops: CropData[];
    rawValues?: string[];
}

export interface SheetResult {
    locations: ProcessedLocationData[];
    productCatalog: Record<string, string>;
}

export interface SheetData {
    [key: string]: string;
}
