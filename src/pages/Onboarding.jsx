import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Activity, Target, CheckCircle2, User, Ruler } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ACTIVITY_LEVELS, GOAL_CONFIGS, calculateGoalCalories, projectTimeline } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';

const STEPS = [
  'welcome',
  'gender',
  'metrics',
  'activity',
  'goal',
  'target',
  'results'
];

export default function Onboarding() {
  const { 
    setOnboardingComplete, 
    setProfile, 
    setGoal, 
    setTargetWeight, 
    setActivityLevel,
    setTargetDate 
  } = useAppStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    gender: 'male',
    age: 25,
    height: 175,
    weight: 75,
    activityLevel: 'sedentary',
    goal: 'maintain',
    targetWeight: 75,
    durationWeeks: 4,
  });

  const currentStep = STEPS[stepIndex];

  const nextStep = () => {
    triggerHaptic('light');
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    triggerHaptic('light');
    if (stepIndex > 0) setStepIndex(s => s - 1);
  };

  const updateForm = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    triggerHaptic('selection');
  };

  const finishOnboarding = () => {
    // Save to store
    setProfile({
      gender: formData.gender,
      age: formData.age,
      height: formData.height,
      weight: formData.weight
    });
    setActivityLevel(formData.activityLevel);
    setGoal(formData.goal);
    setTargetWeight(formData.targetWeight);
    
    // Set target date if applicable
    if (formData.goal === 'maintain' || formData.goal === 'recomp') {
      const d = new Date();
      d.setDate(d.getDate() + formData.durationWeeks * 7);
      setTargetDate(d.toLocaleDateString('en-CA'));
    } else {
      // Calculate from projection
      const goalConfig = GOAL_CONFIGS[formData.goal];
      const p = projectTimeline(formData.weight, formData.targetWeight, goalConfig.weeklyChangeKg);
      setTargetDate(p.projectedDate);
    }

    setOnboardingComplete(true);
  };

  // Pre-calculate results for the final screen or target screen
  const projection = calculateGoalCalories(
    { gender: formData.gender, age: formData.age, height: formData.height, weight: formData.weight },
    formData.goal,
    formData.activityLevel
  );

  const timeline = projectTimeline(formData.weight, formData.targetWeight, GOAL_CONFIGS[formData.goal]?.weeklyChangeKg || 0);

  return (
    <div className="fixed inset-0 bg-[#FAFBFC] dark:bg-[#0A0A0C] flex flex-col z-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4">
        {stepIndex > 0 ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={prevStep}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#141416] border border-gray-100 dark:border-[#1f1f23] shadow-sm text-gray-500"
          >
            <ChevronLeft size={20} />
          </motion.button>
        ) : <div className="w-10" />}
        
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex 
                  ? 'w-6 bg-gray-900 dark:bg-white' 
                  : i < stepIndex 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-gray-200 dark:bg-[#1f1f23]'
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="h-full flex flex-col"
          >
            {/* Step 1: Welcome */}
            {currentStep === 'welcome' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gray-900 dark:bg-white rounded-[32px] flex items-center justify-center mb-8 shadow-2xl">
                  <span className="text-[40px]">🔥</span>
                </div>
                <h1 className="text-[40px] font-black tracking-tighter text-gray-900 dark:text-white mb-4">
                  Kcal
                </h1>
                <p className="text-[16px] text-gray-500 dark:text-gray-400 font-medium mb-12 max-w-[280px]">
                  Premium calorie tracking, designed for aesthetics and efficiency.
                </p>
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-[20px] text-left">
                  <p className="text-[13px] font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                    Privacy Notice: Kcal runs entirely on your device. Your data is stored locally and never leaves your phone.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Gender */}
            {currentStep === 'gender' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-2 dark:text-white">Biological Sex</h2>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mb-8">Used to calculate your basal metabolic rate accurately.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {['male', 'female'].map(g => (
                    <button
                      key={g}
                      onClick={() => updateForm({ gender: g })}
                      className={`flex flex-col items-center justify-center p-8 rounded-[24px] border-2 transition-all ${
                        formData.gender === g
                          ? 'border-gray-900 dark:border-white bg-white dark:bg-[#1f1f23]'
                          : 'border-transparent bg-white dark:bg-[#141416] hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <User size={32} className={`mb-4 ${formData.gender === g ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                      <span className={`font-bold capitalize ${formData.gender === g ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{g}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Metrics */}
            {currentStep === 'metrics' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-8 dark:text-white">Body Metrics</h2>
                
                <div className="space-y-6">
                  {/* Stepper for Height */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Height</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateForm({ height: formData.height - 1 })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                      <span className="text-[24px] font-black w-20 text-center tabular-nums dark:text-white">{formData.height}<span className="text-[14px] text-gray-400 ml-1">cm</span></span>
                      <button onClick={() => updateForm({ height: formData.height + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                    </div>
                  </div>

                  {/* Stepper for Weight */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Weight</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateForm({ weight: formData.weight - 1 })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                      <span className="text-[24px] font-black w-20 text-center tabular-nums dark:text-white">{formData.weight}<span className="text-[14px] text-gray-400 ml-1">kg</span></span>
                      <button onClick={() => updateForm({ weight: formData.weight + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                    </div>
                  </div>

                  {/* Stepper for Age */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Age</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateForm({ age: formData.age - 1 })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                      <span className="text-[24px] font-black w-20 text-center tabular-nums dark:text-white">{formData.age}<span className="text-[14px] text-gray-400 ml-1">yo</span></span>
                      <button onClick={() => updateForm({ age: formData.age + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Activity Level */}
            {currentStep === 'activity' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-2 dark:text-white">Activity Level</h2>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mb-6">How active are you in your daily life?</p>
                
                <div className="space-y-3">
                  {Object.entries(ACTIVITY_LEVELS).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => updateForm({ activityLevel: key })}
                      className={`w-full text-left p-5 rounded-[20px] border-2 transition-all ${
                        formData.activityLevel === key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'border-transparent bg-white dark:bg-[#141416] hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <h3 className={`font-black text-[16px] ${formData.activityLevel === key ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>{data.label}</h3>
                      <p className={`text-[13px] font-medium mt-1 ${formData.activityLevel === key ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-gray-500'}`}>{data.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Goal */}
            {currentStep === 'goal' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-2 dark:text-white">Your Goal</h2>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mb-6">What are you trying to achieve?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(GOAL_CONFIGS).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => updateForm({ goal: key })}
                      className={`flex flex-col p-5 rounded-[24px] border-2 transition-all items-start ${
                        formData.goal === key
                          ? 'border-gray-900 dark:border-white bg-white dark:bg-[#1f1f23]'
                          : 'border-transparent bg-white dark:bg-[#141416] hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[32px] mb-3">{data.emoji}</span>
                      <h3 className={`font-black text-[16px] ${formData.goal === key ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{data.label}</h3>
                      <p className="text-[12px] font-medium text-gray-500 mt-1 text-left line-clamp-2">{data.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Target */}
            {currentStep === 'target' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-2 dark:text-white">Set Target</h2>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mb-8">
                  {formData.goal === 'cut' || formData.goal === 'bulk' ? 'What is your target weight?' : 'How long do you want to track?'}
                </p>

                {(formData.goal === 'cut' || formData.goal === 'bulk') ? (
                  <div className="bg-white dark:bg-[#141416] p-8 rounded-[32px] flex flex-col items-center shadow-sm">
                    <span className="font-bold text-gray-400 mb-6 uppercase tracking-widest text-[12px]">Target Weight</span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => updateForm({ targetWeight: formData.targetWeight - 1 })} className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/5 font-black text-xl">-</button>
                      <div className="text-center w-28">
                        <span className="text-[48px] font-black tabular-nums leading-none dark:text-white">{formData.targetWeight}</span>
                        <span className="block text-[14px] font-bold text-gray-400 mt-1">kg</span>
                      </div>
                      <button onClick={() => updateForm({ targetWeight: formData.targetWeight + 1 })} className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xl">+</button>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 dark:bg-[#0A0A0C] rounded-[16px] w-full text-center border border-gray-100 dark:border-[#1f1f23]">
                      <p className="text-[13px] font-bold text-gray-500">Projected completion</p>
                      <p className="text-[16px] font-black text-gray-900 dark:text-white mt-1">
                        {timeline.feasibility === 'mismatch' ? 'Invalid Target' : `${timeline.weeksNeeded} weeks`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#141416] p-8 rounded-[32px] flex flex-col items-center shadow-sm">
                    <span className="font-bold text-gray-400 mb-6 uppercase tracking-widest text-[12px]">Duration</span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => updateForm({ durationWeeks: Math.max(1, formData.durationWeeks - 1) })} className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/5 font-black text-xl">-</button>
                      <div className="text-center w-28">
                        <span className="text-[48px] font-black tabular-nums leading-none dark:text-white">{formData.durationWeeks}</span>
                        <span className="block text-[14px] font-bold text-gray-400 mt-1">Weeks</span>
                      </div>
                      <button onClick={() => updateForm({ durationWeeks: formData.durationWeeks + 1 })} className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xl">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Results Reveal */}
            {currentStep === 'results' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-6 dark:text-white">Your Plan is Ready</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#141416] p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-[#1f1f23]"
                  >
                    <span className="text-[12px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Target</span>
                    <span className="text-[32px] font-black text-emerald-500 tabular-nums">{projection.targetCals}</span>
                    <span className="text-[12px] font-bold text-gray-500 ml-1">kcal</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#141416] p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-[#1f1f23]"
                  >
                    <span className="text-[12px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">TDEE</span>
                    <span className="text-[32px] font-black text-gray-900 dark:text-white tabular-nums">{projection.tdee}</span>
                    <span className="text-[12px] font-bold text-gray-500 ml-1">kcal</span>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-[#141416] p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-[#1f1f23] mb-6"
                >
                  <span className="text-[12px] font-bold text-gray-400 block mb-4 uppercase tracking-widest">Macro Split</span>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-500">Protein</span>
                      <span className="font-black tabular-nums dark:text-white">{projection.macros.p}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-500">Carbs</span>
                      <span className="font-black tabular-nums dark:text-white">{projection.macros.c}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-500">Fat</span>
                      <span className="font-black tabular-nums dark:text-white">{projection.macros.f}g</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-5 rounded-[20px] flex items-start gap-3"
                >
                  <Activity size={20} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] font-bold text-blue-900 dark:text-blue-300 leading-relaxed">
                    Based on your profile, we've set an optimal macro split to ensure you reach your goal efficiently while preserving lean mass.
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 bg-[#FAFBFC] dark:bg-[#0A0A0C]">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className="w-full py-4.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] font-black text-[16px] flex items-center justify-center gap-2 shadow-lg dark:shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
        >
          {stepIndex === STEPS.length - 1 ? (
            <>Let's Go <CheckCircle2 size={20} strokeWidth={2.5} /></>
          ) : (
            <>Continue <ArrowRight size={20} strokeWidth={2.5} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}
