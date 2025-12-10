/**
 * Formats a date (Date object or date string) using the specified locale
 * @param date - Date object, date string (ISO format or parseable date string), null, or undefined
 * @param locale - Locale code (e.g., 'sr', 'en', 'sr-RS', 'en-US')
 * @returns Formatted date string (e.g., "15. januar 2024." for Serbian, "January 15, 2024" for English)
 */
export function formatDate(date: Date | string | null | undefined, locale: string): string {
  if (!date) return "";

  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else {
    try {
      dateObj = new Date(date);
      if (Number.isNaN(dateObj.getTime())) return date;
    } catch {
      return date;
    }
  }

  const dateLocale = locale;
  return dateObj.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
