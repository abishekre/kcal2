import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { VALIDATION } from '../../utils/constants';
import { useSheetA11y } from '../../hooks/useSheetA11y';

export default function CustomMealSheet({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const sheetRef = useSheetA11y(onClose);

  const handleCommit = () => {
    if (name.trim()) {
      triggerHaptic('success');
      onAdd(name.trim());
      onClose();
    } else {
      triggerHaptic('error');
      setError('Give this meal a name first');
    }
  };

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Add custom meal"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 bg-[#F0F1EE]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-50 flex flex-col justify-end"
    >
      <div className="bg-white dark:bg-[#141416] p-6 rounded-t-[32px] border-t border-gray-100 dark:border-[#1f1f23] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter">Add Custom Meal</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} aria-label="Close" className="p-2 bg-gray-50 dark:bg-[#0A0A0C] rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <input
            autoFocus
            type="text"
            value={name}
            maxLength={VALIDATION.mealNameMaxLength}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            placeholder="e.g. Pre-Workout, Midnight Snack..."
            aria-label="Custom meal name"
            aria-invalid={!!error}
            className="w-full bg-gray-50 dark:bg-[#0A0A0C] px-6 py-5 rounded-[20px] font-bold text-lg outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-800 transition-colors"
          />
          <div className="flex justify-between items-center mt-2 px-1">
            {error ? (
              <p role="alert" className="text-rose-500 font-bold text-xs">{error}</p>
            ) : <span />}
            <span className="text-gray-300 text-xs font-bold tabular-nums">{name.length}/{VALIDATION.mealNameMaxLength}</span>
          </div>
        </div>

        <button
          onClick={handleCommit}
          disabled={!name.trim()}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          <Check size={20} /> Add Meal
        </button>
      </div>
    </motion.div>
  );
}
