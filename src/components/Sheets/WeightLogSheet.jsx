import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus, Scale, Save, CalendarDays } from 'lucide-react';
import { useWeightStore } from '../../store/useWeightStore';
import { useAppStore } from '../../store/useAppStore';
import { formatDateLong } from '../../utils/dates';
import { triggerHaptic } from '../../utils/haptics';

export default function WeightLogSheet({ onClose }) {
  const selectedDate = useAppStore(state => state.selectedDate);
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);
  
  const logWeight = useWeightStore(state => state.logWeight);
  const getWeightForDate = useWeightStore(state => state.getWeightForDate);
  const getWeightTrend = useWeightStore(state => state.getWeightTrend);

  const [weight, setWeight] = useState(profile.weight);
  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);
  
  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate);
    const existing = getWeightForDate(selectedDate);
    setWeight(existing || profile.weight);
  }

  const recentWeights = getWeightTrend(5).reverse();

  const handleLog = () => {
    triggerHaptic('success');
    logWeight(selectedDate, weight);
    setProfile({ weight }); // Update profile weight to match latest
    onClose();
  };

  const adjust = (amount) => {
    triggerHaptic('light');
    setWeight(prev => Math.round((prev + amount) * 10) / 10);
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
      className="fixed inset-0 bg-[#FAFBFC] dark:bg-[#0A0A0C] z-50 overflow-y-auto"
    >
      <div className="p-6 pb-4 sticky top-0 bg-[#FAFBFC]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center pt-4 mb-6">
          <h2 className="text-3xl font-black tracking-tighter">Log Weight</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-3 bg-white dark:bg-[#141416] rounded-full shadow-sm border border-gray-100 dark:border-[#1f1f23]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-32 space-y-8">
        
        <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-sm bg-gray-100 dark:bg-[#141416] py-3 rounded-full mx-auto w-max px-6">
          <CalendarDays size={18} /> {formatDateLong(selectedDate)}
        </div>

        <div className="bg-white dark:bg-[#141416] p-8 rounded-[32px] border border-gray-100 dark:border-[#1f1f23] shadow-sm flex flex-col items-center">
          <Scale size={32} className="text-gray-300 dark:text-gray-700 mb-6" />
          
          <div className="flex items-center justify-center gap-6 w-full">
            <button 
              onClick={() => adjust(-0.1)}
              onPointerDown={() => triggerHaptic('light')}
              className="w-14 h-14 bg-gray-50 dark:bg-[#0A0A0C] rounded-full flex items-center justify-center active:scale-90 transition-transform active:bg-gray-200 dark:active:bg-[#1f1f23]"
            >
              <Minus size={24} />
            </button>
            
            <div className="flex items-baseline w-40 justify-center">
              <input 
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setWeight(val);
                  else if (e.target.value === '') setWeight('');
                }}
                onBlur={() => {
                  if (!weight || weight < 20) setWeight(profile.weight);
                }}
                className="text-6xl font-black tabular-nums tracking-tighter text-center bg-transparent outline-none w-full border-none"
              />
              <span className="text-xl font-bold text-gray-400 ml-1">kg</span>
            </div>
            
            <button 
              onClick={() => adjust(0.1)}
              onPointerDown={() => triggerHaptic('light')}
              className="w-14 h-14 bg-gray-50 dark:bg-[#0A0A0C] rounded-full flex items-center justify-center active:scale-90 transition-transform active:bg-gray-200 dark:active:bg-[#1f1f23]"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex gap-4 mt-8 w-full">
            {[-1, -0.5, 0.5, 1].map(val => (
              <button 
                key={val}
                onClick={() => adjust(val)}
                className="flex-1 py-3 bg-gray-50 dark:bg-[#0A0A0C] rounded-[16px] font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {val > 0 ? '+' : ''}{val}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleLog}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <Save size={20} /> Save Weight
        </button>

        {recentWeights.length > 0 && (
          <section>
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4 px-2">Recent Logs</h3>
            <div className="bg-white dark:bg-[#141416] rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm overflow-hidden">
              {recentWeights.map((log, index) => (
                <div key={log.date} className={`flex justify-between items-center p-4 ${index !== recentWeights.length - 1 ? 'border-b border-gray-100 dark:border-[#1f1f23]' : ''}`}>
                  <span className="font-bold text-sm text-gray-500">{formatDateLong(log.date)}</span>
                  <span className="font-black tabular-nums">{log.weight.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </motion.div>
  );
}
