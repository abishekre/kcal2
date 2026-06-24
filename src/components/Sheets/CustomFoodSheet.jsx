import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { useFoodStore } from '../../store/useFoodStore';
import { triggerHaptic } from '../../utils/haptics';
import { FOOD_CATEGORIES } from '../../data/foods';

const MACRO_COLORS = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 placeholder-blue-300 dark:placeholder-blue-500/50 focus:border-blue-200 dark:focus:border-blue-500/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 placeholder-emerald-300 dark:placeholder-emerald-500/50 focus:border-emerald-200 dark:focus:border-emerald-500/30',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 placeholder-amber-300 dark:placeholder-amber-500/50 focus:border-amber-200 dark:focus:border-amber-500/30'
};

export default function CustomFoodSheet({ onClose }) {
  const addCustomFood = useFoodStore(state => state.addCustomFood);

  const [form, setForm] = useState({
    name: '',
    cals: '',
    p: '',
    c: '',
    f: '',
    unit: 'serving',
    category: 'breakfast'
  });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.name.trim()) {
      setError('Name is required');
      triggerHaptic('error');
      return;
    }
    if (form.cals === '' || isNaN(form.cals) || Number(form.cals) < 0) {
      setError('Valid calories required');
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    const customId = `custom_${Date.now()}`;
    addCustomFood(customId, {
      name: form.name.trim(),
      cals: Number(form.cals),
      p: Number(form.p || 0),
      c: Number(form.c || 0),
      f: Number(form.f || 0),
      unit: form.unit,
      category: form.category
    });
    onClose();
  };

  const updateForm = (field, val) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };
      if (['p', 'c', 'f'].includes(field)) {
        const p = Number(next.p || 0);
        const c = Number(next.c || 0);
        const f = Number(next.f || 0);
        if ((p > 0 || c > 0 || f > 0) && !prev.cals) {
          next.cals = String((p * 4) + (c * 4) + (f * 9));
        }
      }
      return next;
    });
    if (error) setError('');
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
          <h2 className="text-3xl font-black tracking-tighter">Create Food</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-3 bg-white dark:bg-[#141416] rounded-full shadow-sm border border-gray-100 dark:border-[#1f1f23]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-32 space-y-6">
        
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-[20px] flex items-center gap-3 font-bold text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[28px] border border-gray-100 dark:border-[#1f1f23] shadow-sm space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Food Name</label>
            <input 
              autoFocus
              type="text" 
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g. Mom's Chicken Curry"
              className="w-full bg-gray-50 dark:bg-[#0A0A0C] px-4 py-4 rounded-[20px] font-bold text-base outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-800 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Calories (kcal)</label>
              <input 
                type="number" 
                inputMode="decimal"
                value={form.cals}
                onChange={(e) => updateForm('cals', e.target.value)}
                placeholder="0"
                className="w-full bg-orange-50 dark:bg-orange-500/10 text-orange-900 dark:text-orange-400 placeholder-orange-300 dark:placeholder-orange-500/50 px-4 py-4 rounded-[20px] font-black text-xl outline-none border border-transparent focus:border-orange-200 dark:focus:border-orange-500/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Serving Unit</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {['serving', '100g', 'ml', 'item'].map(u => (
                  <button
                    key={u}
                    onClick={() => updateForm('unit', u)}
                    className={`whitespace-nowrap px-4 py-3 rounded-[16px] font-bold text-sm transition-colors border ${form.unit === u ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-500 border-transparent'}`}
                  >
                    {u === '100g' ? '100g (grams)' : u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
              {Object.entries(FOOD_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => updateForm('category', key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 rounded-[16px] font-bold text-sm transition-colors border ${form.category === key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-[#0A0A0C] text-gray-500 border-transparent'}`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141416] p-5 rounded-[28px] border border-gray-100 dark:border-[#1f1f23] shadow-sm">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Macros (Optional)</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'p', label: 'Protein (g)', color: 'blue' },
              { id: 'c', label: 'Carbs (g)', color: 'emerald' },
              { id: 'f', label: 'Fat (g)', color: 'amber' }
            ].map(m => (
              <div key={m.id}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{m.label}</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={form[m.id]}
                  onChange={(e) => updateForm(m.id, e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-3 rounded-[16px] font-bold text-lg outline-none border border-transparent transition-colors text-center tabular-nums ${MACRO_COLORS[m.color]}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <Save size={20} /> Save Food
        </button>
      </div>
    </motion.div>
  );
}
