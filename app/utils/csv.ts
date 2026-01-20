import { SheetData } from "../types/sheet-data";

/**
 * CSV Parser for the specific structure: starts at row 7
 * (or wherever "Tỉnh mới" and "Xã mới" are found)
 */
export function parseCSV(text: string): SheetData[] {
    const lines = text.trim().split(/\r?\n/);
    // Find the header row (contains "Tỉnh mới" and "Xã mới")
    const headerIndex = lines.findIndex(line => line.includes("Tỉnh mới") && line.includes("Xã mới"));
    if (headerIndex === -1 || headerIndex >= lines.length - 1) return [];

    const headers = lines[headerIndex].split(",").map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(headerIndex + 1).map(line => {
        // Handling commas inside quotes properly (e.g., "1,320")
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const entry: SheetData = {};
        headers.forEach((h, i) => {
            if (h) entry[h] = values[i] || "";
        });
        return entry;
    });
}
