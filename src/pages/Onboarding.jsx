import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useWaterStore } from '../store/useWaterStore';
import { ACTIVITY_LEVELS, GOAL_CONFIGS, calculateGoalCalories, projectTimeline, getRecommendedWaterGlasses } from '../engine/projection';
import { triggerHaptic } from '../utils/haptics';
import ScienceSheet from '../components/Sheets/ScienceSheet';
import KcalMark from '../components/Core/KcalMark';

const STEPS = [
  'welcome',
  'metrics',
  'activity',
  'goal',
  'target',
  'results'
];

// formData.height/weight always stay in metric (cm/kg) — the app's engine
// and stored profile are metric-only. These only convert for display when
// the user picks imperial units.
const cmToFeetInches = (cm) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};
const feetInchesToCm = (feet, inches) => Math.round(((feet * 12) + inches) * 2.54);
const kgToLbs = (kg) => Math.round(kg * 2.20462);
const lbsToKg = (lbs) => Math.round((lbs / 2.20462) * 10) / 10;

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
  const [showScience, setShowScience] = useState(false);
  const [unitSystem, setUnitSystem] = useState('metric'); // 'metric' | 'imperial' — display only

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
      weight: formData.weight,
      initialWeight: formData.weight
    });
    setActivityLevel(formData.activityLevel);
    setGoal(formData.goal);
    setTargetWeight(formData.targetWeight);
    useWaterStore.getState().setWaterTarget(getRecommendedWaterGlasses(formData.weight));

    // Set target date if applicable
    if (formData.goal === 'maintain' || formData.goal === 'recomp') {
      const d = addDays(new Date(), formData.durationWeeks * 7);
      setTargetDate(format(d, 'yyyy-MM-dd'));
    } else {
      // Calculate from projection
      const p = projectTimeline(formData.weight, formData.targetWeight, projection.weeklyChange);
      setTargetDate(p.date ? format(p.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    }

    setOnboardingComplete(true);
  };

  // Pre-calculate results for the final screen or target screen
  const projection = calculateGoalCalories(
    { gender: formData.gender, age: formData.age, height: formData.height, weight: formData.weight },
    formData.goal,
    formData.activityLevel
  );

  const timeline = projectTimeline(formData.weight, formData.targetWeight, projection.weeklyChange);

  return (
    <div className="fixed inset-0 bg-[#F0F1EE] dark:bg-[#0A0A0C] flex flex-col z-50">
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
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
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
                <KcalMark size={96} badge className="mb-8 shadow-2xl" />
                <h1 className="text-[40px] font-black tracking-tighter text-gray-900 dark:text-white mb-4">
                  Kcal
                </h1>
                <p className="text-[16px] text-gray-500 dark:text-gray-400 font-medium mb-12 max-w-[280px]">
                  Premium calorie tracking, designed for aesthetics and efficiency.
                </p>
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-[20px] text-left">
                  <p className="text-[13px] font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                    Your food log, weight, and profile are stored in your account so they sync across devices. Only you can see them — you can export or permanently delete everything from Settings at any time.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Metrics (gender + height/weight/age together) */}
            {currentStep === 'metrics' && (
              <div className="flex flex-col h-full mt-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[28px] font-black tracking-tight dark:text-white">About You</h2>
                  <div className="flex bg-gray-100 dark:bg-[#1f1f23] rounded-full p-1" role="radiogroup" aria-label="Unit system">
                    {['metric', 'imperial'].map(u => (
                      <button
                        key={u}
                        role="radio"
                        aria-checked={unitSystem === u}
                        onClick={() => { triggerHaptic('selection'); setUnitSystem(u); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${unitSystem === u ? 'bg-white dark:bg-[#0A0A0C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                      >
                        {u === 'metric' ? 'cm/kg' : 'ft/lbs'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Gender — compact row, folded in here instead of its own screen */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Gender</span>
                    <div className="flex bg-gray-100 dark:bg-[#0A0A0C] rounded-full p-1" role="radiogroup" aria-label="Gender">
                      {['male', 'female', 'other'].map(g => (
                        <button
                          key={g}
                          role="radio"
                          aria-checked={formData.gender === g}
                          onClick={() => { triggerHaptic('selection'); updateForm({ gender: g }); }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${formData.gender === g ? 'bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                        >
                          {g === 'other' ? 'Other' : g}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.gender === 'other' && (
                    <p className="text-[12px] text-gray-400 font-medium -mt-3 px-1 leading-relaxed">
                      Used to estimate your basal metabolic rate. The underlying formula was only studied for male/female, so "other" uses the average of the two as a reasonable estimate.
                    </p>
                  )}

                  {/* Stepper for Height */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Height</span>
                    {unitSystem === 'metric' ? (
                      <div className="flex items-center gap-4">
                        <button aria-label="Decrease height" onClick={() => updateForm({ height: Math.max(100, formData.height - 1) })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                        <div className="flex items-baseline w-24 justify-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Height in centimeters"
                            value={formData.height}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) updateForm({ height: val });
                              else if (e.target.value === '') updateForm({ height: '' });
                            }}
                            onBlur={() => {
                              if (!formData.height || formData.height < 50) updateForm({ height: 175 });
                            }}
                            className="text-[24px] font-black w-14 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                          />
                          <span className="text-[14px] text-gray-400 ml-1">cm</span>
                        </div>
                        <button aria-label="Increase height" onClick={() => updateForm({ height: formData.height + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                      </div>
                    ) : (
                      (() => {
                        const { feet, inches } = cmToFeetInches(formData.height);
                        return (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              aria-label="Height, feet"
                              value={feet}
                              onChange={(e) => {
                                const f = parseInt(e.target.value);
                                if (!isNaN(f)) updateForm({ height: feetInchesToCm(f, inches) });
                              }}
                              className="text-[24px] font-black w-10 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                            />
                            <span className="text-[14px] text-gray-400">ft</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              aria-label="Height, inches"
                              value={inches}
                              onChange={(e) => {
                                const i = parseInt(e.target.value);
                                if (!isNaN(i)) updateForm({ height: feetInchesToCm(feet, i) });
                              }}
                              className="text-[24px] font-black w-10 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                            />
                            <span className="text-[14px] text-gray-400">in</span>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Stepper for Weight */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Weight</span>
                    {unitSystem === 'metric' ? (
                      <div className="flex items-center gap-4">
                        <button aria-label="Decrease weight" onClick={() => updateForm({ weight: Math.max(30, formData.weight - 1) })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                        <div className="flex items-baseline w-24 justify-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Weight in kilograms"
                            value={formData.weight}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) updateForm({ weight: val });
                              else if (e.target.value === '') updateForm({ weight: '' });
                            }}
                            onBlur={() => {
                              if (!formData.weight || formData.weight < 20) updateForm({ weight: 75 });
                            }}
                            className="text-[24px] font-black w-14 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                          />
                          <span className="text-[14px] text-gray-400 ml-1">kg</span>
                        </div>
                        <button aria-label="Increase weight" onClick={() => updateForm({ weight: formData.weight + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <button aria-label="Decrease weight" onClick={() => updateForm({ weight: Math.max(30, lbsToKg(kgToLbs(formData.weight) - 1)) })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                        <div className="flex items-baseline w-24 justify-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Weight in pounds"
                            value={kgToLbs(formData.weight)}
                            onChange={(e) => {
                              const lbs = parseInt(e.target.value);
                              if (!isNaN(lbs)) updateForm({ weight: lbsToKg(lbs) });
                            }}
                            className="text-[24px] font-black w-14 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                          />
                          <span className="text-[14px] text-gray-400 ml-1">lbs</span>
                        </div>
                        <button aria-label="Increase weight" onClick={() => updateForm({ weight: lbsToKg(kgToLbs(formData.weight) + 1) })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
                      </div>
                    )}
                  </div>

                  {/* Stepper for Age */}
                  <div className="bg-white dark:bg-[#141416] p-5 rounded-[24px] flex items-center justify-between shadow-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Age</span>
                    <div className="flex items-center gap-4">
                      <button aria-label="Decrease age" onClick={() => updateForm({ age: Math.max(12, formData.age - 1) })} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 font-bold">-</button>
                      <div className="flex items-baseline w-24 justify-center">
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={formData.age}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updateForm({ age: val });
                            else if (e.target.value === '') updateForm({ age: '' });
                          }}
                          onBlur={() => {
                            if (!formData.age || formData.age < 12) updateForm({ age: 25 });
                          }}
                          className="text-[24px] font-black w-14 text-right tabular-nums bg-transparent outline-none dark:text-white border-none"
                        />
                        <span className="text-[14px] text-gray-400 ml-1">yo</span>
                      </div>
                      <button aria-label="Increase age" onClick={() => updateForm({ age: formData.age + 1 })} className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">+</button>
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
                      <button aria-label="Decrease target weight" onClick={() => updateForm({ targetWeight: Math.max(30, formData.targetWeight - 1) })} className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/5 font-black text-xl">-</button>
                      <div className="text-center w-28">
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={formData.targetWeight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) updateForm({ targetWeight: val });
                            else if (e.target.value === '') updateForm({ targetWeight: '' });
                          }}
                          onBlur={() => {
                            if (!formData.targetWeight || formData.targetWeight < 20) updateForm({ targetWeight: formData.weight });
                          }}
                          className="text-[48px] font-black tabular-nums leading-none text-center bg-transparent outline-none w-full dark:text-white border-none"
                        />
                        <span className="block text-[14px] font-bold text-gray-400 mt-1">kg</span>
                      </div>
                      <button aria-label="Increase target weight" onClick={() => updateForm({ targetWeight: formData.targetWeight + 1 })} className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xl">+</button>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 dark:bg-[#0A0A0C] rounded-[16px] w-full text-center">
                      <p className="text-[13px] font-bold text-gray-500">Projected completion</p>
                      <p className="text-[16px] font-black text-gray-900 dark:text-white mt-1">
                        {timeline.feasibility === 'unrealistic' ? 'Invalid Target' : `${timeline.weeks} weeks`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#141416] p-8 rounded-[32px] flex flex-col items-center shadow-sm">
                    <span className="font-bold text-gray-400 mb-6 uppercase tracking-widest text-[12px]">Duration</span>
                    <div className="flex items-center gap-6">
                      <button aria-label="Decrease duration" onClick={() => updateForm({ durationWeeks: Math.max(1, formData.durationWeeks - 1) })} className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/5 font-black text-xl">-</button>
                      <div className="text-center w-28">
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={formData.durationWeeks}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updateForm({ durationWeeks: val });
                            else if (e.target.value === '') updateForm({ durationWeeks: '' });
                          }}
                          onBlur={() => {
                            if (!formData.durationWeeks || formData.durationWeeks < 1) updateForm({ durationWeeks: 4 });
                          }}
                          className="text-[48px] font-black tabular-nums leading-none text-center bg-transparent outline-none w-full dark:text-white border-none"
                        />
                        <span className="block text-[14px] font-bold text-gray-400 mt-1">Weeks</span>
                      </div>
                      <button aria-label="Increase duration" onClick={() => updateForm({ durationWeeks: formData.durationWeeks + 1 })} className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xl">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Results Reveal */}
            {currentStep === 'results' && (
              <div className="flex flex-col h-full mt-4">
                <h2 className="text-[28px] font-black tracking-tight mb-6 dark:text-white">Your Plan is Ready</h2>
                
                <div className="flex justify-end mb-3">
                  <button onClick={() => setShowScience(true)} className="text-emerald-500 font-bold text-[13px] flex items-center gap-1 hover:opacity-80 transition-opacity">
                    ℹ️ How is this calculated?
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#141416] p-5 rounded-[24px]"
                  >
                    <span className="text-[12px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Target</span>
                    <span className="text-[32px] font-black text-emerald-500 tabular-nums">{projection.targetCals}</span>
                    <span className="text-[12px] font-bold text-gray-500 ml-1">kcal</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#141416] p-5 rounded-[24px]"
                  >
                    <span className="text-[12px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">TDEE</span>
                    <span className="text-[32px] font-black text-gray-900 dark:text-white tabular-nums">{projection.tdee}</span>
                    <span className="text-[12px] font-bold text-gray-500 ml-1">kcal</span>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-[#141416] p-6 rounded-[24px] mb-6"
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

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 bg-[#F0F1EE] dark:bg-[#0A0A0C]">
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
      <AnimatePresence>
        {showScience && <ScienceSheet onClose={() => setShowScience(false)} />}
      </AnimatePresence>
    </div>
  );
}
