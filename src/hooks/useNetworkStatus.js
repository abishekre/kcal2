import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status.
 * Returns { isOnline, wasOffline } — `wasOffline` stays true until dismissed.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // wasOffline stays true so we can show "Back online" briefly
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissOffline = () => setWasOffline(false);

  return { isOnline, wasOffline, dismissOffline };
}
