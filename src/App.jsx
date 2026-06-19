import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import Dashboard from './pages/Dashboard';
import ProgressPage from './pages/ProgressPage';
import SettingsSheet from './components/Sheets/SettingsSheet';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/Core/BottomNav';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const uiStatus = useAppStore(state => state.uiStatus);
  const onboardingComplete = useAppStore(state => state.onboardingComplete);
  const activePage = useAppStore(state => state.activePage);
  const setActivePage = useAppStore(state => state.setActivePage);
  const localNoticeShown = useAppStore(state => state.localNoticeShown);
  const setLocalNoticeShown = useAppStore(state => state.setLocalNoticeShown);

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

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-[100dvh] font-sans bg-bg-app text-gray-900 dark:text-gray-100 relative transition-colors duration-700">
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'progress' && <ProgressPage />}
      {activePage === 'settings' && <SettingsSheet />}

      <BottomNav activePage={activePage} onNavigate={setActivePage} />

      <AnimatePresence>
        {!localNoticeShown && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50 bg-white dark:bg-[#141416] p-4 rounded-[20px] shadow-lg border border-gray-100 dark:border-[#1f1f23] flex items-start gap-3"
          >
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-full shrink-0">
              <Info size={20} className="text-blue-500" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-bold text-sm mb-1">Local Storage Notice</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                All your data is stored locally on your device. We do not use servers. If you clear your browser data, your Kcal history will be lost.
              </p>
            </div>
            <button 
              onClick={() => setLocalNoticeShown(true)}
              className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}