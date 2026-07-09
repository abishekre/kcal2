import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

/**
 * SheetWrapper — Shared bottom sheet container with:
 * - Swipe-down-to-dismiss gesture
 * - Focus trap
 * - Escape key handler
 * - ARIA dialog semantics
 * - Backdrop click to close
 * - prefers-reduced-motion respect
 */
export default function SheetWrapper({
  open,
  onClose,
  title,
  children,
  fullScreen = false,
  className = '',
  zIndex = 50,
}) {
  const sheetRef = useRef(null);
  const previousFocus = useRef(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  // Save focus on open, restore on close
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      // Focus first focusable element in sheet
      requestAnimationFrame(() => {
        const firstFocusable = sheetRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap
  const handleTabTrap = useCallback((e) => {
    if (e.key !== 'Tab' || !sheetRef.current) return;
    
    const focusableElements = sheetRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl?.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, [open, handleTabTrap]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const prefersReducedMotion = 
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const animationProps = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { 
        initial: { y: '100%' }, 
        animate: { y: 0 }, 
        exit: { y: '100%' },
        transition: { type: 'spring', damping: 30, stiffness: 300 } 
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm`}
            style={{ zIndex: zIndex - 1 }}
            aria-hidden="true"
          />
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
            {...animationProps}
            drag={fullScreen ? undefined : 'y'}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={fullScreen ? undefined : handleDragEnd}
            style={fullScreen ? undefined : { y, opacity }}
            className={`
              fixed ${fullScreen ? 'inset-0' : 'bottom-0 left-0 right-0'} 
              bg-white dark:bg-[#141416] 
              ${fullScreen ? '' : 'rounded-t-[28px]'} 
              shadow-2xl overflow-hidden
              ${className}
            `}
            style={{ zIndex }}
          >
            {/* Drag handle (non-fullscreen) */}
            {!fullScreen && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
