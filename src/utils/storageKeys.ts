/**
 * Single source of truth for all localStorage and IndexedDB key strings.
 * Import these constants instead of typing raw strings so a key rename
 * stays in sync everywhere, including in ErrorBoundary which must call
 * localStorage directly without going through hooks.
 */

export const STORAGE_KEYS = {
  // ── localStorage (via useLocalStorage hook) ─────────────────────────────
  SETTINGS: 'vocab_settings',
  FILTERS:  'vocab_filters',

  // ── IndexedDB (via useIndexedDB / localforage) ──────────────────────────
  PROGRESS: 'vocab_progress',
  AVATAR:   'vocab_user_avatar',
  FAVORITES:'vocab_favorites',
  STREAK:   'vocab_streak',
} as const;
