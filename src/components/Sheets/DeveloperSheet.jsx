import React from 'react';
import { motion } from 'framer-motion';
import { X, Code2, Heart, Cpu } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export default function DeveloperSheet({ onClose }) {
  return (
    <motion.div 
      initial={{ y: '100%' }} 
      animate={{ y: 0 }} 
      exit={{ y: '100%' }} 
      transition={{ type: 'spring', damping: 28, stiffness: 350 }} 
      className="fixed inset-0 bg-[#FAFBFC] dark:bg-[#0A0A0C] z-50 overflow-y-auto flex flex-col"
    >
      <div className="p-6 pb-4 sticky top-0 bg-[#FAFBFC]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center mb-6 pt-4">
          <h2 className="text-3xl font-black tracking-tighter">Credits</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-3 bg-white dark:bg-[#141416] rounded-full shadow-sm border border-gray-100 dark:border-[#1f1f23]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col items-center justify-center pb-20 text-center">
        <div className="w-24 h-24 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl rotate-3">
          <Code2 size={48} />
        </div>
        
        <h3 className="text-4xl font-black tracking-tighter mb-2">Abishek</h3>
        <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-sm">Developer & Architect</p>

        <div className="bg-white dark:bg-[#141416] p-6 rounded-[28px] w-full text-left space-y-4 border border-gray-100 dark:border-[#1f1f23] shadow-sm mb-4">
          <p className="font-bold text-sm leading-relaxed">
            Built for the IT warriors in Bangalore who need solid calorie hygiene without the corporate guilt trips.
          </p>
          <div className="flex gap-2 text-xs font-bold text-gray-500 items-center pt-2">
            <Heart size={16} className="text-red-500" />
            <span>Powered by Puttu, Beef Roast & Black Coffee</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-[28px] w-full text-left space-y-4 border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <Cpu size={18} />
            <span className="font-black tracking-widest uppercase text-xs">Tech Stack</span>
          </div>
          <p className="font-bold text-sm text-blue-900 dark:text-blue-300 leading-relaxed">
            Built with React 19 + Zustand 5 + Framer Motion 12 + Tailwind CSS v4.
          </p>
          <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-500/30">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Version</span>
            <span className="font-black text-blue-900 dark:text-blue-300">v6.0</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
