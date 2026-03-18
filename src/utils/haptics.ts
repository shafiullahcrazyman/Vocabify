/**
 * M3 Expressive Haptic Feedback System
 *
 * Philosophy (from M3 Expressive spec):
 *   - Always synchronized with animation timing
 *   - Short, precise, purposeful — never random
 *   - Different patterns communicate different meanings
 *   - Feels like touching real objects
 *   - Never overwhelming
 *
 * Pattern types and when to use each:
 *   tap        → generic tap / navigation (8ms light tick)
 *   selection  → filter chips, tab switches (5ms ultra-light — "texture")
 *   press      → button confirm, open modal (12ms soft click)
 *   toggle     → switches, favorites (8-4-8ms — click-like)
 *   swipe      → prev/next word navigation (6ms directional)
 *   success    → mark learned, task complete (10-40-15ms — celebratory)
 *   warning    → reset confirm, caution (20-10-20ms — attention)
 *   error      → rejection, invalid (30-15-30ms — sharper)
 *   impact     → overlay snap close, fling end (20ms)
 *   longPress  → long press activation (15-5-15ms delayed pulse)
 *
 * Timing rules (M3 Expressive):
 *   Pre-action haptic  → fire BEFORE animation starts (selection, press)
 *   Sync haptic        → fire AT animation peak (impact, toggle)
 *   Post-action haptic → fire AFTER completion (success, warning)
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
 *
 * @example
 *   triggerHaptic(settings.hapticsEnabled);                  // → tap
 *   triggerHaptic(settings.hapticsEnabled, 'success');       // → mark learned
 *   triggerHaptic(settings.hapticsEnabled, 'toggle');        // → switch flip
 *   triggerHaptic(settings.hapticsEnabled, 'selection');     // → filter chip
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
