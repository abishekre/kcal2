import { useEffect, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { flushAll } from './lib/retrySync';
import ErrorBoundary from './components/Core/ErrorBoundary';
import { ToastContainer } from './components/Core/Toast';
import BottomNav from './components/Core/BottomNav';
import KcalMark from './components/Core/KcalMark';
import Auth from './pages/Auth';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const SettingsSheet = lazy(() => import('./components/Sheets/SettingsSheet'));
const WeightLogSheet = lazy(() => import('./components/Sheets/WeightLogSheet'));
const ScienceSheet = lazy(() => import('./components/Sheets/ScienceSheet'));
const AchievementsSheet = lazy(() => import('./components/Sheets/AchievementsSheet'));
const WeeklyRecapSheet = lazy(() => import('./components/Sheets/WeeklyRecapSheet'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

/**
 * Loading splash screen shown during auth checking
 */
function LoadingSplash() {
  return (
    <div className="min-h-[100dvh] bg-bg-app flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <KcalMark size={80} badge className="mb-6 shadow-2xl rotate-3" />
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Kcal</h1>
        <div className="flex gap-1 mt-4">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 rounded-full bg-emerald-500" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-emerald-500" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Offline indicator banner
 */
function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center py-2 px-4 text-xs font-bold"
      role="alert"
      aria-live="assertive"
    >
      You're offline — changes will sync when you reconnect
    </motion.div>
  );
}

/**
 * Suspense fallback for lazy-loaded pages
 */
function PageFallback() {
  return (
    <div className="min-h-[100dvh] bg-bg-app flex items-center justify-center">
      <div className="flex gap-1">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-2 h-2 rounded-full bg-gray-400" />
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.15 }} className="w-2 h-2 rounded-full bg-gray-400" />
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }} className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    </div>
  );
}

export default function App() {
  const theme = useAppStore(state => state.theme);
  const uiStatus = useAppStore(state => state.uiStatus);
  const onboardingComplete = useAppStore(state => state.onboardingComplete);
  const activePage = useAppStore(state => state.activePage);
  const setActivePage = useAppStore(state => state.setActivePage);
  const activeSheet = useAppStore(state => state.activeSheet);
  const setActiveSheet = useAppStore(state => state.setActiveSheet);
  const initSession = useAppStore(state => state.initSession);
  const clearAllStores = useAppStore(state => state.clearAllStores);
  const { isOnline } = useNetworkStatus();

  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initSession(session.user.id);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        initSession(session.user.id);
      }
      // On sign out, clear all stores to prevent cross-account data leakage
      if (event === 'SIGNED_OUT') {
        clearAllStores();
      }
    });

    return () => subscription.unsubscribe();
  }, [initSession, clearAllStores]);

  // Retry any writes still queued from a previous offline stretch as soon
  // as connectivity returns.
  useEffect(() => {
    const handleOnline = () => flushAll();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Theme + status-based styling
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-status', uiStatus);
    
    const applyTheme = (currentTheme) => {
      root.classList.remove('light', 'dark');
      let effectiveTheme = currentTheme;
      if (currentTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.add(effectiveTheme);
      
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      
      let darkColor = '#0A0A0C';
      let lightColor = '#F0F1EE';
      if (uiStatus === 'perfect') {
        darkColor = '#051a0f';
        lightColor = '#ecfdf5';
      } else if (uiStatus === 'over') {
        darkColor = '#1a1206';
        lightColor = '#fffbeb';
      }
      metaThemeColor.content = effectiveTheme === 'dark' ? darkColor : lightColor;
    };

    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme(theme);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, uiStatus]);

  if (authChecking) {
    return <LoadingSplash />;
  }

  if (!session) {
    return (
      <ErrorBoundary>
        <Auth />
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        {!onboardingComplete ? (
          <Onboarding />
        ) : (
          <div className="min-h-[100dvh] font-sans bg-bg-app text-gray-900 dark:text-gray-100 relative transition-colors duration-500">
            {/* Offline indicator */}
            <AnimatePresence>
              {!isOnline && <OfflineBanner />}
            </AnimatePresence>

            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'progress' && <ProgressPage />}
            {activePage === 'settings' && <SettingsSheet />}
            
            <AnimatePresence>
              {activeSheet === 'weightLog' && <WeightLogSheet onClose={() => setActiveSheet(null)} />}
              {activeSheet === 'science' && <ScienceSheet onClose={() => setActiveSheet(null)} />}
              {activeSheet === 'achievements' && <AchievementsSheet onClose={() => setActiveSheet(null)} />}
              {activeSheet === 'weeklyRecap' && <WeeklyRecapSheet onClose={() => setActiveSheet(null)} />}
            </AnimatePresence>

            <BottomNav activePage={activePage} onNavigate={setActivePage} />
          </div>
        )}
      </Suspense>
      <ToastContainer />
    </ErrorBoundary>
  );
}