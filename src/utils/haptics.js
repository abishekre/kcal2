export const triggerHaptic = (type = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'heavy') navigator.vibrate([15, 30, 15]);
    else if (type === 'error') navigator.vibrate([10, 50, 10, 50, 10]);
    else if (type === 'success') navigator.vibrate([10, 30, 20, 30, 10]);
    else navigator.vibrate(10);
  }
};
