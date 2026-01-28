/**
 * Formats a number or numeric string to Vietnamese locale style:
 * - Thousands separator: .
 * - Decimal separator: ,
 */
export function formatNumber(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === "") return "---";

    // Convert to number if string
    const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

    if (isNaN(num)) return String(value);

    return new Intl.NumberFormat("vi-VN").format(num);
}
