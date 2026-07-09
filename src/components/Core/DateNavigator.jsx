
import { useMemo, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateLong(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  const weekday = WEEKDAY_LONG[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  return `${weekday}, ${month} ${day}`;
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(dateKey) {
  return dateKey === getTodayKey();
}

function isFuture(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d > now;
}

function getWeekDays(selectedDateKey) {
  const d = new Date(selectedDateKey + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  // Make week start on Monday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const temp = new Date(monday);
    temp.setDate(monday.getDate() + i);
    const y = temp.getFullYear();
    const m = String(temp.getMonth() + 1).padStart(2, '0');
    const dd = String(temp.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${dd}`);
  }
  return days;
}

export default function DateNavigator({ selectedDate, onDateChange, ledger }) {
  const prefersReduced = useReducedMotion();
  const isTodaySelected = isToday(selectedDate);
  const canGoForward = !isTodaySelected;
  const dateInputRef = useRef(null);

  const openDatePicker = useCallback(() => {
    triggerHaptic('light');
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  }, []);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const navigate = useCallback((offset) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const newKey = `${y}-${m}-${dd}`;
    if (!isFuture(newKey)) {
      triggerHaptic('light');
      onDateChange(newKey);
    }
  }, [selectedDate, onDateChange]);

  const jumpToToday = useCallback(() => {
    triggerHaptic('light');
    onDateChange(getTodayKey());
  }, [onDateChange]);

  const handleDragEnd = useCallback((_event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left → go to next day
      navigate(1);
    } else if (info.offset.x > swipeThreshold) {
      // Swiped right → go to previous day
      navigate(-1);
    }
  }, [navigate]);

  return (
    <div className="mb-8" role="region" aria-label="Date navigation">
      {/* Main date header */}
      <div className="flex items-center justify-between mb-5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          aria-label="Previous day"
          className="w-[44px] h-[44px] flex items-center justify-center rounded-[16px] bg-white dark:bg-[#141416] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#1f1f23] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* Swipe-only region — the native date picker lives in its own
            button below so a tap can't be captured as a drag, or vice versa. */}
        <motion.div
          className="text-center flex-1 relative overflow-hidden touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            key={selectedDate}
            initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            <span className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-white pointer-events-none">
              {isTodaySelected ? 'Today' : formatDateLong(selectedDate)}
            </span>
            {isTodaySelected && (
              <span className="block text-[13px] text-gray-400 font-medium mt-0.5 pointer-events-none">
                {formatDateLong(selectedDate)}
              </span>
            )}
          </motion.div>
        </motion.div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={openDatePicker}
            aria-label="Open date picker"
            className="w-[36px] h-[36px] flex items-center justify-center rounded-[12px] bg-white dark:bg-[#141416] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-[#1f1f23] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <CalendarDays size={16} />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            value={selectedDate}
            max={getTodayKey()}
            onChange={(e) => {
              if (e.target.value) {
                triggerHaptic('light');
                onDateChange(e.target.value);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* "Today" pill button — appears when not viewing today */}
          {!isTodaySelected && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              onClick={jumpToToday}
              aria-label="Jump to today"
              className="px-3 py-2 text-[12px] font-bold tracking-tight rounded-[14px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Today
            </motion.button>
          )}

          <motion.button
            whileTap={canGoForward ? { scale: 0.85 } : undefined}
            onClick={() => navigate(1)}
            disabled={!canGoForward}
            aria-label="Next day"
            className={`w-[44px] h-[44px] flex items-center justify-center rounded-[16px] border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              canGoForward
                ? 'bg-white dark:bg-[#141416] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#1f1f23] shadow-sm'
                : 'bg-[#F0F1EE] dark:bg-[#0A0A0C] text-gray-200 dark:text-gray-800 border-transparent cursor-not-allowed opacity-50'
            }`}
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      {/* Week row */}
      <div className="flex justify-between gap-1.5 px-1" role="group" aria-label="Week days">
        {weekDays.map((dayKey) => {
          const d = new Date(dayKey + 'T00:00:00');
          const dayNum = d.getDate();
          const dayLetter = WEEKDAY_NARROW[d.getDay()];
          const dayLong = WEEKDAY_SHORT[d.getDay()];
          const monthName = MONTH_NAMES[d.getMonth()];
          const isSelected = dayKey === selectedDate;
          const isDisabled = isFuture(dayKey);
          const hasData = ledger?.[dayKey] && Object.values(ledger[dayKey].meals || {}).some(m => Object.keys(m).length > 0);
          const isCommitted = ledger?.[dayKey]?.locked;

          return (
            <motion.button
              layout
              key={dayKey}
              whileTap={!isDisabled ? { scale: 0.9 } : undefined}
              onClick={() => {
                if (!isDisabled) {
                  triggerHaptic('light');
                  onDateChange(dayKey);
                }
              }}
              disabled={isDisabled}
              aria-label={`${dayLong}, ${monthName} ${dayNum}${isSelected ? ' (selected)' : ''}${isCommitted ? ' (committed)' : ''}`}
              aria-current={isSelected ? 'date' : undefined}
              className={`relative flex flex-col items-center justify-center h-[56px] flex-1 rounded-[16px] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isSelected
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : isDisabled
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed bg-transparent'
                    : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                {dayLetter}
              </span>
              <span className="text-[16px] font-black tabular-nums leading-none">
                {dayNum}
              </span>
              {/* Indicator dots */}
              <div className="absolute bottom-1.5 flex items-center justify-center h-1">
                {isCommitted && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                )}
                {hasData && !isCommitted && !isDisabled && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50 dark:bg-gray-900/50' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
