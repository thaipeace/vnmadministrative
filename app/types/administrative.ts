// Types for new administrative structure (2025 reform - no districts)
export interface Ward {
    name: string;
    code: string;
    provinceCode: string; // Direct link to province (no district)
    danSo?: string;
    dienTich?: string;
}

export interface Province {
    name: string;
    code: string;
    wards: Ward[]; // Direct children, no districts
    danSo?: string;
    dienTich?: string;
}

export interface SelectedLocation {
    type: 'province' | 'ward'; // Only 2 levels now
    provinceCode: string;
    wardCode?: string;
    name: string;
}
