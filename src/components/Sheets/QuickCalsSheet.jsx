import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Flame } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export default function QuickCalsSheet({ onClose, onAdd }) {
  const [cals, setCals] = useState('');

  const handleCommit = () => {
    const numCals = parseInt(cals, 10);
    if (!isNaN(numCals) && numCals > 0) {
      triggerHaptic('success');
      onAdd(numCals);
      onClose();
    } else {
      triggerHaptic('error');
    }
  };

  return (
    <motion.div 
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
      className="fixed inset-0 bg-[#FAFBFC]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-[60] flex flex-col justify-end"
    >
      <div className="bg-white dark:bg-[#141416] p-6 rounded-t-[32px] border-t border-gray-100 dark:border-[#1f1f23] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Flame className="text-orange-500" /> Quick Calories
          </h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-2 bg-gray-50 dark:bg-[#0A0A0C] rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <input 
            autoFocus
            type="number" 
            inputMode="decimal"
            value={cals}
            onChange={(e) => setCals(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            placeholder="0"
            className="w-full bg-orange-50 dark:bg-orange-500/10 text-orange-900 dark:text-orange-400 placeholder-orange-300 dark:placeholder-orange-500/50 px-6 py-6 rounded-[24px] font-black text-4xl text-center outline-none border border-transparent focus:border-orange-200 dark:focus:border-orange-500/30 transition-colors tabular-nums"
          />
          <p className="text-center text-gray-400 font-bold text-xs mt-3 uppercase tracking-widest">Enter Kcal Amount</p>
        </div>

        <button 
          onClick={handleCommit}
          disabled={!cals || parseInt(cals, 10) <= 0}
          className="w-full bg-orange-500 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-orange-500/20"
        >
          Add Calories
        </button>
      </div>
    </motion.div>
  );
}
