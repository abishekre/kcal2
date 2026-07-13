// SUPABASE: Maps to tables 'profiles' and 'user_settings'
import { create } from 'zustand';
import { getTodayKey } from '../utils/dates';
import { supabase } from '../lib/supabase.js';
import { useFoodStore } from './useFoodStore.js';
import { useLedgerStore } from './useLedgerStore.js';
import { useWeightStore } from './useWeightStore.js';
import { useWaterStore } from './useWaterStore.js';
import { useTimerStore } from './useTimerStore.js';
import { useExerciseStore } from './useExerciseStore.js';
import { useWorkoutStore } from './useWorkoutStore.js';
import { useActiveWorkoutStore } from './useActiveWorkoutStore.js';
import { toast } from '../lib/toast';
import { flushAll } from '../lib/retrySync';
import debounce from 'lodash/debounce';

const DEFAULT_PROFILE = {
  gender: 'male',
  height: 175,
  weight: 80,
  age: 25,
  initialWeight: 80,
};

const defaultTargetDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

// Tables that hold this user's own data — used by deleteAccountData().
const USER_DATA_TABLES = ['ledger', 'custom_foods', 'custom_meal_configs', 'water_log', 'weight_log', 'workout_sessions', 'custom_exercises', 'workout_routines', 'user_settings'];

export const useAppStore = create((set, get) => ({
  session: null,
  userId: null,

  // Guards against initSession firing twice concurrently (getSession() and
  // onAuthStateChange both resolve on load) and re-hydrating on every
  // auth-state event once already initialized for this user.
  _sessionInitKey: null,

  initSession: async (userId) => {
    if (!userId) return;
    if (get()._sessionInitKey === userId) return;
    set({ _sessionInitKey: userId, userId, session: userId });

    try {
      const { data: settings, error } = await supabase
        .from('user_settings').select('*').eq('user_id', userId).maybeSingle();

      if (error) {
        console.error('Failed to fetch settings', error);
        toast.error('Failed to load your settings');
      }

      if (settings) {
        set({
          profile: {
            gender: settings.profile?.gender ?? 'male',
            height: settings.profile?.height ?? 175,
            weight: settings.profile?.weight ?? 80,
            age: settings.profile?.age ?? 25,
            initialWeight: settings.profile?.initialWeight ?? settings.profile?.weight ?? 80,
          },
          targetWeight: settings.profile?.targetWeight ?? 70,
          targetDate: settings.profile?.targetDate ?? defaultTargetDate(),
          theme: settings.profile?.theme ?? 'system',
          unitSystem: settings.profile?.unitSystem ?? 'metric',
          onboardingComplete: settings.profile?.onboardingComplete ?? false,
          localNoticeShown: settings.profile?.localNoticeShown ?? false,
          goal: settings.goal ?? 'cut',
          activityLevel: settings.activity_level ?? 'sedentary',
          robotMode: settings.robot_mode ?? 'good',
        });
        // Restore the synced water goal if the account has one.
        if (settings.profile?.waterTarget != null) {
          useWaterStore.getState().setWaterTarget(settings.profile.waterTarget, { silent: true });
        }
      }
    } catch (e) {
      console.error('Settings fetch failed', e);
      toast.error('Could not load settings');
    }

    try {
      await Promise.all([
        useFoodStore.getState().hydrateFoods(userId),
        useLedgerStore.getState().hydrateLedger(userId),
        useWeightStore.getState().hydrateWeights(userId),
        useWaterStore.getState().hydrateWater(userId),
        useExerciseStore.getState().hydrateExercises(userId),
        useWorkoutStore.getState().hydrateWorkouts(userId),
      ]);
    } catch (e) {
      console.error("Hydration failed", e);
      toast.error('Some data failed to load. Reload the app to try again.');
    }

    // Retry anything left dirty from a previous session (e.g. the tab was
    // closed before a sync completed).
    flushAll();
  },

  // Debounced sync to prevent rapid-fire Supabase calls
  sync: debounce(() => {
    const s = useAppStore.getState();
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
        // Stored in the settings JSON blob (no schema change) so the water
        // goal roams across devices like the rest of the profile.
        waterTarget: useWaterStore.getState().waterTarget,
        unitSystem: s.unitSystem,
      },
      goal: s.goal,
      activity_level: s.activityLevel,
      robot_mode: s.robotMode,
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) {
        console.error("Sync failed", error);
        toast.error('Failed to save settings');
      }
    });
  }, 500),

  // Profile
  profile: { ...DEFAULT_PROFILE },
  setProfile: (partial) => { set(s => ({ profile: { ...s.profile, ...partial } })); get().sync(); },

  // Goal System
  goal: 'cut',
  setGoal: (goal) => { set({ goal }); get().sync(); },
  targetWeight: 70,
  setTargetWeight: (w) => { set({ targetWeight: w }); get().sync(); },
  targetDate: defaultTargetDate(),
  setTargetDate: (d) => { set({ targetDate: d }); get().sync(); },
  activityLevel: 'sedentary',
  setActivityLevel: (l) => { set({ activityLevel: l }); get().sync(); },

  // App State
  onboardingComplete: false,
  setOnboardingComplete: (v) => { set({ onboardingComplete: v }); get().sync(); },
  localNoticeShown: false,
  setLocalNoticeShown: (v) => { set({ localNoticeShown: v }); get().sync(); },

  // Theme & Robot
  theme: 'system',
  setTheme: (t) => { set({ theme: t }); get().sync(); },
  robotMode: 'good',
  setRobotMode: (m) => { set({ robotMode: m }); get().sync(); },

  // Unit system for display only (engine/storage stay metric). Synced via
  // the settings blob so it roams across devices.
  unitSystem: 'metric', // 'metric' | 'imperial'
  setUnitSystem: (u) => { set({ unitSystem: u }); get().sync(); },

  // UI State (NOT persisted)
  uiStatus: 'low',
  setUiStatus: (s) => set({ uiStatus: s }),
  activeSheet: null,
  setActiveSheet: (s) => set({ activeSheet: s }),
  activeMealTarget: null,
  setActiveMealTarget: (m) => set({ activeMealTarget: m }),
  // Which custom food is being edited (opens CustomFoodSheet in edit mode).
  editingFoodId: null,
  setEditingFoodId: (id) => set({ editingFoodId: id }),
  activePage: 'dashboard',
  setActivePage: (p) => set({ activePage: p }),
  selectedDate: getTodayKey(),
  setSelectedDate: (d) => set({ selectedDate: d }),

  // Clears every persisted store's local state — used on sign-out to
  // prevent the next person on this device from seeing the previous
  // account's data (ledger, weights, foods, water, and fasting timer).
  clearAllStores: () => {
    useLedgerStore.getState().clearAll();
    useWeightStore.getState().clearAll();
    useFoodStore.getState().clearAll();
    useWaterStore.getState().clearAll();
    useTimerStore.getState().clearAll();
    useExerciseStore.getState().clearAll();
    useWorkoutStore.getState().clearAll();
    useActiveWorkoutStore.getState().clearAll();
  },

  // Sign out: clears local device caches (cross-account leak prevention)
  // and ends the Supabase session. Does NOT delete any cloud data — the
  // account's data is still there on next sign-in.
  signOut: async () => {
    get().clearAllStores();
    set({
      session: null,
      userId: null,
      _sessionInitKey: null,
      profile: { ...DEFAULT_PROFILE },
      goal: 'cut',
      targetWeight: 70,
      targetDate: defaultTargetDate(),
      theme: 'system',
      onboardingComplete: false,
      localNoticeShown: false,
      activityLevel: 'sedentary',
      robotMode: 'good',
      uiStatus: 'low',
      activeSheet: null,
      activeMealTarget: null,
      activePage: 'dashboard',
      selectedDate: getTodayKey(),
    });
    await supabase.auth.signOut();
    window.location.reload();
  },

  // The real destructive action behind "Reset All Data": permanently
  // deletes this user's rows from every table that stores their data, then
  // signs out. Irreversible.
  deleteAccountData: async () => {
    const userId = get().userId;
    if (!userId) {
      await get().signOut();
      return;
    }

    const results = await Promise.allSettled(
      USER_DATA_TABLES.map((table) =>
        supabase.from(table).delete().eq('user_id', userId).then(({ error }) => {
          if (error) throw error;
        })
      )
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Account data deletion partially failed', failed);
      toast.error('Some data could not be deleted. Please try again or contact support.');
    }

    await get().signOut();
  },
}));
