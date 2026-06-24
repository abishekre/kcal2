import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Copy, Check } from 'lucide-react';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useAppStore } from '../../store/useAppStore';
import { triggerHaptic } from '../../utils/haptics';

export default function TemplateSheet({ onClose }) {
  const selectedDate = useAppStore(state => state.selectedDate);
  const ledger = useLedgerStore(state => state.ledger);
  const templates = useLedgerStore(state => state.templates);
  const saveTemplate = useLedgerStore(state => state.saveTemplate);
  const loadTemplate = useLedgerStore(state => state.loadTemplate);

  const [templateName, setTemplateName] = useState('');
  const [toast, setToast] = useState('');

  const currentRecord = ledger[selectedDate];
  const hasMeals = currentRecord && Object.values(currentRecord.meals).some(meal => Object.keys(meal).length > 0);

  const handleSave = () => {
    if (!templateName.trim()) return;
    triggerHaptic('success');
    saveTemplate(templateName, selectedDate);
    setToast('Template Saved!');
    setTemplateName('');
    setTimeout(() => setToast(''), 2000);
  };

  const handleLoad = (tplId) => {
    triggerHaptic('success');
    loadTemplate(selectedDate, tplId);
    setToast('Template Loaded!');
    setTimeout(() => { setToast(''); onClose(); }, 1000);
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
      className="fixed inset-0 bg-[#FAFBFC] dark:bg-[#0A0A0C] z-50 flex flex-col"
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-black tracking-tighter">Day Templates</h2>
          <button onClick={() => { triggerHaptic('light'); onClose(); }} className="p-3 bg-gray-50 dark:bg-[#0A0A0C] rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        {/* Save Current Day */}
        {hasMeals ? (
          <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] border border-gray-100 dark:border-[#1f1f23] shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold">
              <Save size={20} /> Save Today as Template
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="e.g. Leg Day, Rest Day"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-[#0A0A0C] px-4 py-3 rounded-[16px] font-bold text-sm outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-800 transition-colors"
              />
              <button 
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 font-bold rounded-[16px] disabled:opacity-50 active:scale-95 transition-transform"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-[#2c2c2e] rounded-[24px] text-gray-400 font-bold text-sm">
            Log some foods today to save as a template.
          </div>
        )}

        {/* Saved Templates */}
        <div>
          <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-4 px-2">Your Templates</h3>
          {Object.keys(templates).length === 0 ? (
            <div className="text-center py-10 opacity-50 font-bold">No templates saved yet.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(templates).map(([tId, tpl]) => (
                <div key={tId} className="flex justify-between items-center p-4 rounded-[24px] bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] shadow-sm">
                  <div className="font-bold text-base">{tpl.name}</div>
                  <button 
                    onClick={() => handleLoad(tId)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0C] hover:bg-gray-100 dark:hover:bg-[#1c1c1e] transition-colors active:scale-95"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 z-50 pointer-events-none"
          >
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
