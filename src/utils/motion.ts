/**
 * M3 Expressive spring tokens for Framer Motion / motion-react.
 *
 * Three size tiers × two categories:
 *   Spatial  → position, scale, size  (allows slight bounce)
 *   Effects  → opacity, color         (critically damped, no bounce)
 *
 *   Fast     → small elements: buttons, chips, switches
 *   Default  → partial-screen: drawers, bottom sheets, cards
 *   Slow     → full-screen: overlays, page transitions
 *
 * Exit animations use exitCurve (duration-based) because springs overshoot
 * in the wrong direction on exit.
 */

// ─── Expressive scheme (recommended default) ──────────────────────────────────

/** Buttons, chips, icon buttons, toggles — position & scale */
export const fastSpatial = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 38,   // ratio ≈ 0.85 → subtle overshoot, snappy feel
  mass: 1,
} as const;

/** Buttons, chips — color, opacity */
export const fastEffects = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 48,   // ratio ≈ 1.07 → critically damped, no bounce
  mass: 1,
} as const;

/** Bottom sheets, drawers, nav rail — position & scale */
export const defaultSpatial = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 29,   // ratio ≈ 0.84 → gentle bounce
  mass: 1,
} as const;

/** Bottom sheets, drawers — color, opacity */
export const defaultEffects = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 36,   // ratio ≈ 1.04 → overdamped, clean
  mass: 1,
} as const;

/** Full-screen overlays, page transitions — position & scale */
export const slowSpatial = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 24,   // ratio ≈ 0.90 → matches M3 exactly
  mass: 1,
} as const;

/** Full-screen overlays — color, opacity */
export const slowEffects = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 28,   // ratio ≈ 1.04 → overdamped, clean fade
  mass: 1,
} as const;

// ─── Exit curve (duration-based) ──────────────────────────────────────────────
// Springs don't suit exit animations — they overshoot the wrong way.
// M3 uses the Emphasized Accelerate curve for exits.
export const exitCurve = {
  duration: 0.15,
  ease: [0.3, 0, 0.8, 0.15] as const,   // motionEasingEmphasizedAccelerate
} as const;

export const exitCurveSlow = {
  duration: 0.2,
  ease: [0.3, 0, 0.8, 0.15] as const,
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────
/** Returns the correct spatial spring based on element size/distance */
export const spatialSpring = (size: 'fast' | 'default' | 'slow') => {
  switch (size) {
    case 'fast':    return fastSpatial;
    case 'slow':    return slowSpatial;
    default:        return defaultSpatial;
  }
};
