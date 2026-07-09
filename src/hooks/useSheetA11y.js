import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal-sheet accessibility behavior: focus trap, Escape-to-close,
 * and focus restoration on close. Attach the returned ref to the sheet's
 * outer element (which should also carry role="dialog" aria-modal="true").
 *
 * Every sheet renders its own outer motion.div and calls this hook directly
 * for consistent keyboard/focus handling, rather than going through a shared
 * wrapper component.
 */
export function useSheetA11y(onClose) {
  const ref = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      // Respect an existing autoFocus inside the sheet rather than
      // stealing focus to whatever's first in DOM order.
      if (ref.current && ref.current.contains(document.activeElement) && document.activeElement !== ref.current) {
        return;
      }
      const firstFocusable = ref.current?.querySelector(FOCUSABLE);
      firstFocusable?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;

      const focusableElements = ref.current.querySelectorAll(FOCUSABLE);
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl?.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return ref;
}
