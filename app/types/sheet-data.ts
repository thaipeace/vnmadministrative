export interface MedicineData {
    name: string;
    value: string;
    imageUrl?: string;
    pest?: string;
}

export interface StageData {
    name: string;
    medicines: MedicineData[];
    totalArea?: string;
    opportunity?: string;
    pests: string[];
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

export interface ProductInfo {
    image: string;
    price: string;
}

export interface SheetResult {
    locations: ProcessedLocationData[];
    productCatalog: Record<string, ProductInfo>;
}

export interface SheetData {
    [key: string]: string;
}
