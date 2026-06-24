import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { useGlobalStore } from './store/useGlobalStore';
import Dashboard from './pages/Dashboard';
import ProgressPage from './pages/ProgressPage';
import SettingsSheet from './components/Sheets/SettingsSheet';
import WeightLogSheet from './components/Sheets/WeightLogSheet';
import ScienceSheet from './components/Sheets/ScienceSheet';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/Core/BottomNav';
import Auth from './pages/Auth';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const uiStatus = useAppStore(state => state.uiStatus);
  const onboardingComplete = useAppStore(state => state.onboardingComplete);
  const activePage = useAppStore(state => state.activePage);
  const setActivePage = useAppStore(state => state.setActivePage);
  const activeSheet = useAppStore(state => state.activeSheet);
  const setActiveSheet = useAppStore(state => state.setActiveSheet);
  const initSession = useAppStore(state => state.initSession);
  const fetchGlobals = useGlobalStore(state => state.fetchGlobals);

  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    fetchGlobals();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initSession(session.user.id);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initSession(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [initSession, fetchGlobals]);

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
      let lightColor = '#FAFBFC';
      if (uiStatus === 'perfect') {
        darkColor = '#051a0f';
        lightColor = '#ecfdf5';
      } else if (uiStatus === 'over') {
        darkColor = '#1a0505';
        lightColor = '#fff1f2';
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
    return (
      <div className="min-h-[100dvh] bg-bg-app flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl rotate-3">
            <span className="text-[32px]">🔥</span>
          </div>
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

  if (!session) {
    return <Auth />;
  }

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-[100dvh] font-sans bg-bg-app text-gray-900 dark:text-gray-100 relative transition-colors duration-700">
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'progress' && <ProgressPage />}
      {activePage === 'settings' && <SettingsSheet />}
      <AnimatePresence>
        {activeSheet === 'weightLog' && <WeightLogSheet onClose={() => setActiveSheet(null)} />}
        {activeSheet === 'science' && <ScienceSheet onClose={() => setActiveSheet(null)} />}
      </AnimatePresence>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}