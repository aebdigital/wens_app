/**
 * Utility functions for parsing and formatting dates in Spis module.
 * Handles various legacy formats like "DD. MM. YYYY" and ensures ISO output.
 */

export const parseSpisDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;

    // Try standard date parsing first (ISO)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try loose format (DD.MM.YYYY, DD. MM. YYYY, DD/MM/YYYY)
    // Matches: 13. 1. 2026, 13.1.2026, 13/1/2026, 1.1.2026
    const parts = dateStr.match(/^(\d{1,2})[. /]+(\d{1,2})[. /]+(\d{4})/);
    if (parts) {
        // parts[1] is day, parts[2] is month, parts[3] is year
        const d = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

export const formatSpisDateToISO = (dateStr: string | undefined | null): string => {
    const date = parseSpisDate(dateStr);
    if (!date) return '';

    // Ensure accurate YYYY-MM-DD regardless of local timezone offset impacting the day
    // We treat the input strings as local dates.
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
