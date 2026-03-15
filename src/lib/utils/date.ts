/**
 * Utility for month-based date range calculations.
 * Operates in UTC and returns ISO date strings (YYYY-MM-DD).
 */
export function getMonthDateRange(monthStr?: string | null) {
    const now = new Date();
    let year: number;
    let month: number; // 0-indexed

    // Validate format YYYY-MM
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (monthStr && monthRegex.test(monthStr)) {
        [year, month] = monthStr.split('-').map(Number);
        month -= 1; // Convert to 0-indexed
    } else {
        year = now.getUTCFullYear();
        month = now.getUTCMonth();
    }

    // Start date: first day of the selected month
    const startDate = new Date(Date.UTC(year, month, 1));

    // End date: first day of the next month
    const endDate = new Date(Date.UTC(year, month + 1, 1));

    const normalizedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    const normalizedMonthDay1 = `${normalizedMonth}-01`;

    return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        normalizedMonth,
        normalizedMonthDay1 // Used for exchange rate lookup
    };
}
