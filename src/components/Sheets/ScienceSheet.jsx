import { motion } from 'framer-motion';
import { X, BookOpen, Activity, FlaskConical, Info } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useSheetA11y } from '../../hooks/useSheetA11y';

export default function ScienceSheet({ onClose }) {
  const sheetRef = useSheetA11y(onClose);
  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="The science behind Kcal"
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
      className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] z-50 flex flex-col"
    >
      <div className="px-6 pt-16 pb-4 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-[#1f1f23] rounded-b-[32px] shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">The Science</h2>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">How Kcal Calculates</p>
        </div>
        <button onClick={() => { triggerHaptic('light'); onClose(); }} aria-label="Close science info" className="w-10 h-10 bg-gray-100 dark:bg-[#1f1f23] rounded-full flex items-center justify-center">
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
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[16px]">
            <p className="text-[12px] font-bold text-gray-400 mb-1">Source</p>
            <p className="text-[12px] text-gray-600 dark:text-gray-300">
              Mifflin, M. D., et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals". The American Journal of Clinical Nutrition. <br/><a href="https://doi.org/10.1093/ajcn/51.2.241" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">DOI: 10.1093/ajcn/51.2.241</a>
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-[12px] flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Macronutrient Split</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium mb-3">
            We prioritize <strong>protein</strong> to preserve lean mass during cuts and build muscle during bulks. Protein multipliers range from <strong>1.8g to 2.2g per kg of body weight</strong> depending on your goal, aligning with current sports nutrition guidelines. Fats are set at <strong>25-30% of remaining calories</strong> for hormonal health, with the rest filled by carbohydrates.
          </p>
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[16px] space-y-3">
            <div>
              <p className="text-[12px] font-bold text-gray-400 mb-1">Source (Fat Loss)</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300">
                Helms, E. R., et al. (2014). "Evidence-based recommendations for natural bodybuilding contest preparation". JISSN. <br/><a href="https://doi.org/10.1186/1550-2783-11-20" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">DOI: 10.1186/1550-2783-11-20</a>
              </p>
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-400 mb-1">Source (Maintenance/Bulk)</p>
              <p className="text-[12px] text-gray-600 dark:text-gray-300">
                Morton, R. W., et al. (2018). "A systematic review, meta-analysis... of protein supplementation". BJSM. <br/><a href="https://doi.org/10.1136/bjsports-2017-097608" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">DOI: 10.1136/bjsports-2017-097608</a>
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
            Your TDEE scales your BMR by an Activity Multiplier (1.2 to 1.9). Kcal's goal algorithms modify your TDEE by a fixed percentage of it: <strong>-20%</strong> for Cut, <strong>-10%</strong> for Recomp, <strong>0%</strong> for Maintain, and <strong>+10%</strong> for Lean Bulk — scaled to your own energy expenditure rather than a flat number, to drive safe and sustainable changes without excessive metabolic adaptation.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-[12px] flex items-center justify-center">
              <Info size={20} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">How This Is Approximated</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium">
            A few numbers here are useful approximations, not exact physical constants — worth knowing about:
          </p>
          <ul className="mt-3 space-y-2 text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed font-medium list-disc pl-5">
            <li><strong>7,700 kcal ≈ 1kg of fat</strong> is a population-average estimate (real adipose tissue is only ~87% lipid). Individual results vary with water shifts, glycogen, and lean-mass changes.</li>
            <li><strong>Metabolic adaptation</strong> (the BMR-per-kg-lost figure used in your projection timeline) is modeled as a simple linear estimate — the real effect is more variable and can be larger than this model predicts.</li>
            <li><strong>Non-binary BMR</strong> uses the average of the male/female offsets above, since the original 1990 study only defined those two — it's a sensible approximation, not a value from the source research.</li>
            <li><strong>The 8-glass water default</strong> is a common rule of thumb, not a clinical target — actual needs vary with body size, activity, and climate. The Water card on your dashboard can suggest a target scaled to your weight instead.</li>
          </ul>
        </section>
      </div>
    </motion.div>
  );
}
