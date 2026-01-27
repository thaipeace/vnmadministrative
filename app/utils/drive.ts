/**
 * Converts a Google Drive sharing link to a direct image link or thumbnail link.
 * Supports /view, /file/d/, and ?id= formats.
 */
export function getGoogleDriveDirectLink(url: string | undefined): string {
    if (!url || url === "0" || typeof url !== "string") return "";

    // Extract File ID using Regex
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    const fileId = fileIdMatch ? fileIdMatch[1] : null;

    if (!fileId) {
        // If it's already a direct link or something else, return as is
        if (url.startsWith("http")) return url;
        return "";
    }

    // Option A: thumbnail (Best for UI performance, handles resizing)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;

    // Option B: direct export (good, but sometimes hit-or-miss with CORS/cookies)
    // return `https://drive.google.com/uc?id=${fileId}&export=download`;
}
