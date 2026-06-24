import { format, parse, subDays, differenceInDays, isAfter, startOfWeek, endOfWeek } from 'date-fns';

export const parseDateKey = (dateKey) => {
  return parse(dateKey, 'yyyy-MM-dd', new Date());
};

export const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

export const getYesterdayKey = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

export const getRelativeYesterdayKey = (dateKey) => format(subDays(parseDateKey(dateKey), 1), 'yyyy-MM-dd');

export const getDaysRemaining = (targetDate) => {
  return differenceInDays(parseDateKey(targetDate), parseDateKey(getTodayKey()));
};

export const getPastDaysKeys = (daysCount) => {
  const keys = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    keys.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  return keys;
};

export const formatDateShort = (dateKey) => format(parseDateKey(dateKey), 'MMM d');

export const formatDateLong = (dateKey) => format(parseDateKey(dateKey), 'EEEE, MMM d');

export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const isToday = (dateKey) => {
  return dateKey === getTodayKey();
};

export const isFuture = (dateKey) => {
  return isAfter(parseDateKey(dateKey), parseDateKey(getTodayKey()));
};

export const getWeekRange = (dateKey) => {
  const d = parseDateKey(dateKey);
  const start = startOfWeek(d, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
};
