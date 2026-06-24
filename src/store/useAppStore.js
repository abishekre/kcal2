// SUPABASE: Maps to tables 'profiles' and 'user_settings'
import { create } from 'zustand';
import { getTodayKey } from '../utils/dates';
import { supabase } from '../lib/supabase.js';
import { useFoodStore } from './useFoodStore.js';
import { useLedgerStore } from './useLedgerStore.js';
import { useWeightStore } from './useWeightStore.js';

export const useAppStore = create((set, get) => ({
  session: null,
  userId: null,
  isAdmin: false,

  initSession: async (userId) => {
    set({ userId, session: true });
    
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (settings) {
      set({
        profile: {
          gender: settings.profile?.gender || 'male',
          height: settings.profile?.height || 175,
          weight: settings.profile?.weight || 80,
          age: settings.profile?.age || 25,
          initialWeight: settings.profile?.initialWeight || settings.profile?.weight || 80,
        },
        targetWeight: settings.profile?.targetWeight || 70,
        targetDate: settings.profile?.targetDate || '2026-12-31',
        theme: settings.profile?.theme || 'dark',
        onboardingComplete: settings.profile?.onboardingComplete || false,
        localNoticeShown: settings.profile?.localNoticeShown || false,
        goal: settings.goal || 'cut',
        activityLevel: settings.activity_level || 'sedentary',
        robotMode: settings.robot_mode || 'good',
        isAdmin: settings.is_admin || false,
      });
    }

    try {
      await Promise.all([
        useFoodStore.getState().hydrateFoods(userId),
        useLedgerStore.getState().hydrateLedger(userId),
        useWeightStore.getState().hydrateWeights(userId)
      ]);
    } catch (e) {
      console.error("Hydration failed", e);
    }
  },

  sync: () => {
    const s = get();
    if (!s.userId) return;
    supabase.from('user_settings').upsert({
      user_id: s.userId,
      profile: {
        gender: s.profile.gender,
        height: s.profile.height,
        weight: s.profile.weight,
        age: s.profile.age,
        initialWeight: s.profile.initialWeight,
        targetWeight: s.targetWeight,
        targetDate: s.targetDate,
        theme: s.theme,
        onboardingComplete: s.onboardingComplete,
        localNoticeShown: s.localNoticeShown,
      },
      goal: s.goal,
      activity_level: s.activityLevel,
      robot_mode: s.robotMode,
    }).then(({error}) => { if (error) console.error("Sync failed", error); });
  },

  // Profile
  profile: {
    gender: 'male',
    height: 175,
    weight: 80,
    age: 25,
    initialWeight: 80,
  },
  setProfile: (partial) => { set(s => ({ profile: { ...s.profile, ...partial } })); get().sync(); },

  // Goal System
  goal: 'cut',
  setGoal: (goal) => { set({ goal }); get().sync(); },
  targetWeight: 70,
  setTargetWeight: (w) => { set({ targetWeight: w }); get().sync(); },
  targetDate: '2026-12-31',
  setTargetDate: (d) => { set({ targetDate: d }); get().sync(); },
  activityLevel: 'sedentary',
  setActivityLevel: (l) => { set({ activityLevel: l }); get().sync(); },

  // App State
  onboardingComplete: false,
  setOnboardingComplete: (v) => { set({ onboardingComplete: v }); get().sync(); },
  localNoticeShown: false,
  setLocalNoticeShown: (v) => { set({ localNoticeShown: v }); get().sync(); },

  // Theme & Robot
  theme: 'dark',
  setTheme: (t) => { set({ theme: t }); get().sync(); },
  robotMode: 'good',
  setRobotMode: (m) => { set({ robotMode: m }); get().sync(); },

  // UI State (NOT persisted)
  uiStatus: 'low',
  setUiStatus: (s) => set({ uiStatus: s }),
  activeSheet: null,
  setActiveSheet: (s) => set({ activeSheet: s }),
  activeMealTarget: null,
  setActiveMealTarget: (m) => set({ activeMealTarget: m }),
  activePage: 'dashboard',
  setActivePage: (p) => set({ activePage: p }),
  selectedDate: getTodayKey(),
  setSelectedDate: (d) => set({ selectedDate: d }),

  // Reset / Logout
  resetAll: async () => {
    useLedgerStore.setState({ ledger: {}, customMealConfigs: {} });
    useWeightStore.setState({ weights: {} });
    useFoodStore.setState({ customFoods: {} });
    set({ session: null, userId: null, profile: {} });
    await supabase.auth.signOut();
    window.location.reload();
  }
}));
