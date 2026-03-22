/**
 * Haptic feedback patterns following M3 Expressive timing principles.
 *
 * Pattern reference:
 *   tap        → generic tap / navigation (8ms)
 *   selection  → filter chips, tab switches (5ms)
 *   press      → button confirm, open modal (12ms)
 *   toggle     → switches, favorites (8-4-8ms)
 *   swipe      → prev/next navigation (6ms)
 *   success    → mark learned, task complete (10-40-15ms)
 *   warning    → reset confirm, caution (20-10-20ms)
 *   error      → rejection, invalid input (30-15-30ms)
 *   impact     → overlay snap close (20ms)
 *   longPress  → long press activation (15-5-15ms)
 */

export type HapticPattern =
  | 'tap'
  | 'selection'
  | 'press'
  | 'toggle'
  | 'swipe'
  | 'success'
  | 'warning'
  | 'error'
  | 'impact'
  | 'longPress';

// Vibration sequences in milliseconds.
// [duration] = single pulse
// [duration, pause, duration, ...] = rhythm
const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap:       8,               // light single tick
  selection: 5,               // ultra-light "texture" feel
  press:     12,              // soft confirmation click
  toggle:    [8, 4, 8],       // satisfying double-click like a real toggle
  swipe:     6,               // directional flick
  success:   [10, 40, 15],    // light → pause → medium — celebratory rhythm
  warning:   [20, 10, 20],    // medium-light pulse — attention
  error:     [30, 15, 30],    // sharper rhythm — clear rejection feel
  impact:    20,              // snap — heavier single hit
  longPress: [15, 5, 15],     // double pulse on activation
};

/**
 * Trigger a haptic feedback pattern.
 *
 * @param enabled - Whether haptics are enabled in user settings.
 * @param pattern - Which pattern to fire. Defaults to 'tap'.
 */
export const triggerHaptic = (
  enabled: boolean,
  pattern: HapticPattern = 'tap',
): void => {
  if (
    !enabled ||
    typeof window === 'undefined' ||
    !window.navigator?.vibrate
  ) {
    return;
  }
  window.navigator.vibrate(PATTERNS[pattern]);
};
