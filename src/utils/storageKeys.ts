/**
 * storageKeys — Single source of truth for every localStorage / IndexedDB key
 * used across the app.
 *
 * Why this file exists:
 *   ErrorBoundary is a class component and cannot use hooks, so it must call
 *   localStorage directly rather than going through useLocalStorage. Without
 *   a shared constants file, the key strings 'vocab_settings' and
 *   'vocab_filters' were duplicated between AppContext and ErrorBoundary.
 *   A key rename in one place would silently break the other.
 *
 * Import this wherever a storage key string is needed instead of typing
 * the raw string literal.
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
