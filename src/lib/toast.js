import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════════
// Toast Store — Global notification system
// (Kept out of Toast.jsx so that file exports only the ToastContainer
// component — a file exporting a mix of components and plain values breaks
// Fast Refresh.)
// ═══════════════════════════════════════════════════════════════════════════
export const useToastStore = create((set, get) => ({
  toasts: [],

  /** Show a toast notification.
   * @param {string} message - The message to display
   * @param {'success'|'error'|'warning'|'info'|'undo'} type
   * @param {object} options - { duration, onUndo, undoLabel }
   */
  addToast: (message, type = 'info', options = {}) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    // Undo toasts get extra time — enough to actually read and react to them.
    const duration = options.duration ?? (type === 'error' ? 5000 : type === 'undo' ? 6000 : 3500);

    const toast = { id, message, type, ...options };
    set(s => ({ toasts: [...s.toasts, toast] }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        // Only fire onTimeout if the toast is still on screen — if it was
        // already dismissed (Undo clicked, or manually removed) the timeout
        // no longer represents "the window elapsed without action", so
        // running onTimeout here would double-fire alongside onUndo.
        const stillPresent = get().toasts.some(t => t.id === id);
        get().removeToast(id);
        if (stillPresent && type === 'undo' && options.onTimeout) {
          options.onTimeout();
        }
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },

  clearAll: () => set({ toasts: [] }),
}));

// Convenience helpers
export const toast = {
  success: (msg, opts) => useToastStore.getState().addToast(msg, 'success', opts),
  error: (msg, opts) => useToastStore.getState().addToast(msg, 'error', opts),
  warning: (msg, opts) => useToastStore.getState().addToast(msg, 'warning', opts),
  info: (msg, opts) => useToastStore.getState().addToast(msg, 'info', opts),
  undo: (msg, opts) => useToastStore.getState().addToast(msg, 'undo', opts),
};
