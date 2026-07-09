// Track whether we've already logged the "vibrate not supported" warning
let _vibrateWarningLogged = false;

/**
 * Checks whether the Vibration API is available.
 * On iOS Safari and some browsers, navigator.vibrate does not exist.
 * Logs a warning once if not supported.
 * @returns {boolean} True if navigator.vibrate is available
 */
function isVibrationSupported() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    if (!_vibrateWarningLogged) {
      console.warn('[Haptics] Vibration API not supported on this device/browser (common on iOS).');
      _vibrateWarningLogged = true;
    }
    return false;
  }
  return true;
}

/**
 * Triggers a haptic vibration pattern based on the specified type.
 *
 * Supported types:
 * - 'light'   — subtle tap (15ms)
 * - 'medium'  — moderate tap (25ms)
 * - 'heavy'   — strong tap with pattern (20ms, 30ms pause, 20ms)
 * - 'error'   — triple buzz error pattern
 * - 'success' — ascending buzz success pattern
 *
 * @param {'light'|'medium'|'heavy'|'error'|'success'} type - The haptic feedback type
 */
export const triggerHaptic = (type = 'light') => {
  if (!isVibrationSupported()) return;

  switch (type) {
    case 'heavy':
      navigator.vibrate([20, 30, 20]);
      break;
    case 'medium':
      navigator.vibrate([25]);
      break;
    case 'error':
      navigator.vibrate([15, 50, 15, 50, 15]);
      break;
    case 'success':
      navigator.vibrate([15, 30, 25, 30, 15]);
      break;
    case 'light':
    default:
      navigator.vibrate(15);
      break;
  }
};
