import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdatePrompt
 *
 * Rendered once at the top of the app tree (inside AppContent, outside the router).
 *
 * How it works:
 *  1. useRegisterSW registers the service worker and watches for a new version
 *     waiting behind the currently-active SW.
 *  2. When a new SW is ready, `needRefresh` flips to true → the snackbar appears.
 *  3. "Update now" calls updateServiceWorker(true), which posts a SKIP_WAITING
 *     message to the new SW so it activates immediately, then the page reloads
 *     with the fresh bundle.
 *  4. "Later" just hides the snackbar; the update will apply on the next
 *     natural page load.
 */
export const UpdatePrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Poll every 60 s so long-running sessions still catch updates.
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60_000);
      }
    },
  });

  const visible = needRefresh && !dismissed;

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
    >
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-high text-on-surface px-4 py-3 shadow-lg">
        {/* Icon */}
        <RefreshCw size={20} className="shrink-0 text-primary" />

        {/* Message */}
        <p className="flex-1 text-sm leading-snug">
          A new version of Vocabify is ready.
        </p>

        {/* Update button */}
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary active:opacity-80 transition-opacity"
        >
          Update
        </button>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update prompt"
          className="shrink-0 text-on-surface-variant active:opacity-60 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
