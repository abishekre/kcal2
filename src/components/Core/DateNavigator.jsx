import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

function formatDateLong(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function isToday(dateKey) {
  return dateKey === new Date().toLocaleDateString('en-CA');
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
    days.push(temp.toLocaleDateString('en-CA'));
  }
  return days;
}

export default function DateNavigator({ selectedDate, onDateChange, ledger }) {
  const isTodaySelected = isToday(selectedDate);
  const canGoForward = !isTodaySelected;

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const navigate = (offset) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const newKey = d.toLocaleDateString('en-CA');
    if (!isFuture(newKey)) {
      triggerHaptic('light');
      onDateChange(newKey);
    }
  };

  return (
    <div className="mb-8">
      {/* Main date header */}
      <div className="flex items-center justify-between mb-5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          className="w-[44px] h-[44px] flex items-center justify-center rounded-[16px] bg-white dark:bg-[#141416] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#1f1f23] shadow-sm"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="text-center flex-1 relative overflow-hidden">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, scale: 0.95 }}
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
          <input 
            type="date"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={selectedDate}
            max={new Date().toLocaleDateString('en-CA')}
            onChange={(e) => {
              if (e.target.value) {
                triggerHaptic('light');
                onDateChange(e.target.value);
              }
            }}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(1)}
          disabled={!canGoForward}
          className={`w-[44px] h-[44px] flex items-center justify-center rounded-[16px] border transition-colors ${
            canGoForward
              ? 'bg-white dark:bg-[#141416] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#1f1f23] shadow-sm'
              : 'bg-[#FAFBFC] dark:bg-[#0A0A0C] text-gray-200 dark:text-gray-800 border-transparent cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Week row */}
      <div className="flex justify-between gap-1.5 px-1">
        {weekDays.map((dayKey) => {
          const d = new Date(dayKey + 'T00:00:00');
          const dayNum = d.getDate();
          const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
          const isSelected = dayKey === selectedDate;
          const isDisabled = isFuture(dayKey);
          const hasData = ledger?.[dayKey] && Object.values(ledger[dayKey].meals || {}).some(m => Object.keys(m).length > 0);
          const isCommitted = ledger?.[dayKey]?.locked;

          return (
            <motion.button
              layout
              key={dayKey}
              whileTap={!isDisabled ? { scale: 0.9 } : {}}
              onClick={() => {
                if (!isDisabled) {
                  triggerHaptic('light');
                  onDateChange(dayKey);
                }
              }}
              disabled={isDisabled}
              className={`relative flex flex-col items-center justify-center h-[56px] flex-1 rounded-[16px] transition-all duration-200 ${
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
