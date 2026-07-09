import { format, parse, subDays, differenceInCalendarDays, isAfter, isValid, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Parses a date key string (yyyy-MM-dd) into a Date object.
 * @param {string} dateKey - Date string in 'yyyy-MM-dd' format
 * @returns {Date} Parsed Date object
 */
export const parseDateKey = (dateKey) => {
  return parse(dateKey, 'yyyy-MM-dd', new Date());
};

/**
 * Returns today's date as a formatted key string.
 * @returns {string} Today's date in 'yyyy-MM-dd' format
 */
export const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Returns yesterday's date as a formatted key string.
 * @returns {string} Yesterday's date in 'yyyy-MM-dd' format
 */
export const getYesterdayKey = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

/**
 * Returns the day before a given date key.
 * @param {string} dateKey - Reference date in 'yyyy-MM-dd' format
 * @returns {string} The previous day in 'yyyy-MM-dd' format
 */
export const getRelativeYesterdayKey = (dateKey) => format(subDays(parseDateKey(dateKey), 1), 'yyyy-MM-dd');

/**
 * Calculates the number of calendar days remaining until a target date.
 * Uses differenceInCalendarDays (not differenceInDays, which truncates by
 * 24h and under-reports by one for most of the current day) so "tomorrow"
 * always reads as 1 day remaining regardless of the current time.
 * @param {string} targetDate - Target date in 'yyyy-MM-dd' format
 * @returns {number} Number of days remaining (negative if target is in the past)
 */
export const getDaysRemaining = (targetDate) => {
  return differenceInCalendarDays(parseDateKey(targetDate), new Date());
};

/**
 * Generates an array of date key strings for the past N days (including today).
 * @param {number} daysCount - Number of days to look back
 * @returns {string[]} Array of date keys in 'yyyy-MM-dd' format, most recent first
 */
export const getPastDaysKeys = (daysCount) => {
  const keys = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    keys.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  return keys;
};

/**
 * Formats a date key into a short display format (e.g., "Jul 7").
 * @param {string} dateKey - Date in 'yyyy-MM-dd' format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateKey) => format(parseDateKey(dateKey), 'MMM d');

/**
 * Formats a date key into a long display format (e.g., "Monday, Jul 7").
 * @param {string} dateKey - Date in 'yyyy-MM-dd' format
 * @returns {string} Formatted date string
 */
export const formatDateLong = (dateKey) => format(parseDateKey(dateKey), 'EEEE, MMM d');

/**
 * Returns the current time of day as a string.
 * @returns {'morning'|'afternoon'|'evening'|'night'} Time of day category
 */
export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Checks whether a date key represents today.
 * @param {string} dateKey - Date in 'yyyy-MM-dd' format
 * @returns {boolean} True if the date key is today
 */
export const isToday = (dateKey) => {
  return dateKey === getTodayKey();
};

/**
 * Checks whether a date key is in the future.
 * @param {string} dateKey - Date in 'yyyy-MM-dd' format
 * @returns {boolean} True if the date is after today
 */
export const isFuture = (dateKey) => {
  return isAfter(parseDateKey(dateKey), new Date());
};

/**
 * Returns the start and end date keys for the ISO week containing the given date.
 * Weeks start on Monday.
 * @param {string} dateKey - Date in 'yyyy-MM-dd' format
 * @returns {{ start: string, end: string }} Week range as date keys
 */
export const getWeekRange = (dateKey) => {
  const d = parseDateKey(dateKey);
  const start = startOfWeek(d, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
};

/**
 * Validates that a date key string is in the correct format (yyyy-MM-dd)
 * and represents an actual valid calendar date.
 * @param {string} dateKey - String to validate
 * @returns {boolean} True if the date key is valid
 */
export const isValidDateKey = (dateKey) => {
  if (typeof dateKey !== 'string') return false;
  // Check format with regex first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  // Parse and check actual validity (e.g., rejects 2024-02-31)
  const parsed = parse(dateKey, 'yyyy-MM-dd', new Date());
  if (!isValid(parsed)) return false;
  // Verify round-trip: formatting the parsed date should give back the same string
  return format(parsed, 'yyyy-MM-dd') === dateKey;
};
