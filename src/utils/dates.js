export const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysRemaining = (targetDate) => {
  const today = new Date(getTodayKey());
  const target = new Date(targetDate);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPastDaysKeys = (daysCount) => {
  const keys = [];
  const d = new Date(getTodayKey());
  for (let i = 0; i < daysCount; i++) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() - 1);
  }
  return keys;
};

export const formatDateShort = (dateKey) => {
  const d = new Date(dateKey);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return formatter.format(d);
};

export const formatDateLong = (dateKey) => {
  const d = new Date(dateKey);
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return formatter.format(d);
};

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
  return new Date(dateKey) > new Date(getTodayKey());
};

export const getWeekRange = (dateKey) => {
  const d = new Date(dateKey);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(d.setDate(diff));
  
  const yearS = start.getFullYear();
  const monthS = String(start.getMonth() + 1).padStart(2, '0');
  const dayS = String(start.getDate()).padStart(2, '0');
  const startKey = `${yearS}-${monthS}-${dayS}`;

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const yearE = end.getFullYear();
  const monthE = String(end.getMonth() + 1).padStart(2, '0');
  const dayE = String(end.getDate()).padStart(2, '0');
  const endKey = `${yearE}-${monthE}-${dayE}`;

  return { start: startKey, end: endKey };
};
