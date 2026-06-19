// SUPABASE: Maps to tables 'profiles' and 'user_settings'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayKey } from '../utils/dates';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Profile
      profile: {
        gender: 'male',
        height: 175,
        weight: 80,
        age: 25,
      },
      setProfile: (partial) => set(s => ({ profile: { ...s.profile, ...partial } })),

      // Goal System
      goal: 'cut',
      setGoal: (goal) => set({ goal }),
      targetWeight: 70,
      setTargetWeight: (w) => set({ targetWeight: w }),
      targetDate: '2026-12-31',
      setTargetDate: (d) => set({ targetDate: d }),
      activityLevel: 'sedentary',
      setActivityLevel: (l) => set({ activityLevel: l }),

      // App State
      onboardingComplete: false,
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
      localNoticeShown: false,
      setLocalNoticeShown: (v) => set({ localNoticeShown: v }),

      // Theme & Robot
      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      robotMode: 'good',
      setRobotMode: (m) => set({ robotMode: m }),

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

      // Reset
      resetAll: () => {
        localStorage.removeItem('kcal_app');
        localStorage.removeItem('kcal_weight');
        localStorage.removeItem('kcal_ledger');
        localStorage.removeItem('kcal_foods');
        window.location.reload();
      }
    }),
    {
      name: 'kcal_app',
      partialize: (s) => ({
        profile: s.profile, goal: s.goal, targetWeight: s.targetWeight,
        targetDate: s.targetDate, activityLevel: s.activityLevel,
        onboardingComplete: s.onboardingComplete, localNoticeShown: s.localNoticeShown,
        theme: s.theme, robotMode: s.robotMode,
      }),
    }
  )
);
