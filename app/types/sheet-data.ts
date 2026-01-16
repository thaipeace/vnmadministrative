export interface SheetData {
    [key: string]: string;
}

export interface LocationData {
    provinceName: string;
    wardName?: string;
    data: SheetData;
}
