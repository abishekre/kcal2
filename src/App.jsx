import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { useGlobalStore } from './store/useGlobalStore';
import Dashboard from './pages/Dashboard';
import ProgressPage from './pages/ProgressPage';
import SettingsSheet from './components/Sheets/SettingsSheet';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/Core/BottomNav';
import Auth from './pages/Auth';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const uiStatus = useAppStore(state => state.uiStatus);
  const onboardingComplete = useAppStore(state => state.onboardingComplete);
  const activePage = useAppStore(state => state.activePage);
  const setActivePage = useAppStore(state => state.setActivePage);
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
  }, [initSession]);

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
    return <div className="min-h-[100dvh] bg-bg-app" />;
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

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}