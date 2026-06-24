import { motion } from 'framer-motion';
import { X, BookOpen, Activity, Beaker } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export default function ScienceSheet({ onClose }) {
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
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">The Science</h2>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">How Kcal Calculates</p>
        </div>
        <button onClick={() => { triggerHaptic('light'); onClose(); }} className="w-10 h-10 bg-gray-100 dark:bg-[#1f1f23] rounded-full flex items-center justify-center">
          <X size={20} className="text-gray-900 dark:text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-32">
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-[12px] flex items-center justify-center">
              <Activity size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Basal Metabolic Rate</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium mb-3">
            Your BMR is the amount of energy your body burns at rest. Kcal uses the <strong>Mifflin-St Jeor equation</strong> to calculate this, which the Academy of Nutrition and Dietetics recognizes as the most accurate predictive formula for resting energy expenditure.
          </p>
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[16px] border border-gray-100 dark:border-[#1f1f23]">
            <p className="text-[12px] font-bold text-gray-400 mb-1">Source</p>
            <p className="text-[12px] text-gray-600 dark:text-gray-300">
              Mifflin, M. D., et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals". The American Journal of Clinical Nutrition. <br/><em>DOI: 10.1093/ajcn/51.2.241</em>
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-[12px] flex items-center justify-center">
              <Beaker size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Macronutrient Split</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium mb-3">
            We prioritize <strong>protein</strong> to preserve lean mass during cuts and build muscle during bulks. Protein multipliers range from <strong>1.6g to 2.2g per kg of body weight</strong> depending on your goal, aligning with current sports nutrition guidelines. Fats are set at ~25-30% of remaining calories for hormonal health, with the rest filled by carbohydrates.
          </p>
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[16px] border border-gray-100 dark:border-[#1f1f23] space-y-3">
            <div>
              <p className="text-[12px] font-bold text-gray-400 mb-1">Source (Fat Loss)</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300">
                Helms, E. R., et al. (2014). "Evidence-based recommendations for natural bodybuilding contest preparation". JISSN. <br/><em>DOI: 10.1186/1550-2783-11-20</em>
              </p>
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-400 mb-1">Source (Maintenance/Bulk)</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300">
                Morton, R. W., et al. (2018). "A systematic review, meta-analysis... of protein supplementation". BJSM. <br/><em>DOI: 10.1136/bjsports-2017-097608</em>
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-[12px] flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Total Daily Energy Expenditure</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium mb-3">
            Your TDEE scales your BMR by an Activity Multiplier (1.2 to 1.9). Kcal's goal algorithms modify your TDEE by creating a calorie deficit (-20%) or surplus (+10%) to drive safe and sustainable changes without causing metabolic adaptation.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
