import { useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

/**
 * App-wide swipe navigation
 *
 * Virtual tab order:  [Settings] ← Home → Filter → Progress
 *
 * - Swipe LEFT  → advance to the next tab
 * - Swipe RIGHT → go back to the previous tab
 * - Swipe RIGHT on Home → open the Settings drawer (nothing is to the left)
 *
 * Guards:
 *   • Ignores swipes when any modal/overlay is open (body.modal-open)
 *   • Requires horizontal travel > THRESHOLD px
 *   • Requires horizontal delta to be at least DIRECTION_BIAS × vertical delta
 *     so that normal vertical scrolling is never accidentally triggered
 *   • Cleans up properly on pointer-cancel (e.g. system gesture interrupts)
 */

const TABS = ['/home', '/filter', '/progress'] as const;
const SWIPE_THRESHOLD = 55;   // minimum horizontal pixels to count as a swipe
const DIRECTION_BIAS   = 1.8; // dx must be N× larger than dy

export const useSwipeNav = () => {
  const navigate            = useNavigate();
  const location            = useLocation();
  const { settings, setIsSettingsOpen } = useAppContext();

  const startX    = useRef(0);
  const startY    = useRef(0);
  const active    = useRef(false); // true once a pointer is down

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only track primary pointer (finger 0 or left mouse button)
    if (!e.isPrimary) return;
    // Do nothing while any overlay is open
    if (document.body.classList.contains('modal-open')) return;

    startX.current = e.clientX;
    startY.current = e.clientY;
    active.current = true;
  }, []);

  const resolve = useCallback((endX: number, endY: number) => {
    if (!active.current) return;
    active.current = false;

    const dx = endX - startX.current;
    const dy = endY - startY.current;

    // Must travel far enough horizontally
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // Must be predominantly horizontal
    if (Math.abs(dx) < Math.abs(dy) * DIRECTION_BIAS) return;

    const currentPath  = location.pathname;
    const currentIndex = TABS.indexOf(currentPath as typeof TABS[number]);
    if (currentIndex === -1) return;

    if (dx < 0) {
      // ← Swipe left → go forward (next tab)
      if (currentIndex < TABS.length - 1) {
        triggerHaptic(settings.hapticsEnabled, 'swipe');
        navigate(TABS[currentIndex + 1]);
      }
    } else {
      // → Swipe right → go back (previous tab) or open settings from Home
      if (currentIndex > 0) {
        triggerHaptic(settings.hapticsEnabled, 'swipe');
        navigate(TABS[currentIndex - 1]);
      } else {
        // currentIndex === 0 → on Home, swipe right → open Settings
        triggerHaptic(settings.hapticsEnabled, 'swipe');
        setIsSettingsOpen(true);
      }
    }
  }, [location.pathname, navigate, settings.hapticsEnabled, setIsSettingsOpen]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    resolve(e.clientX, e.clientY);
  }, [resolve]);

  const onPointerCancel = useCallback(() => {
    // Pointer was cancelled (e.g. system back gesture) — just reset
    active.current = false;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
};
