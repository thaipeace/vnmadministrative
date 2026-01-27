/**
 * Normalizes location names for robust matching.
 */
export function normalizeLocationName(name: string): string {
    if (!name) return "";

    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/đ/g, "d")
        .replace(/^(tinh|thanh pho|quan|huyen|xa|phuong|all|total|tongcong)\s+/i, "") // Remove common prefixes
        .replace(/\s+(all|total|tongcong)$/i, "") // Remove common suffixes
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/[^a-z0-9]/g, "") // Remove special characters
        .trim();
}
