/**
 * useBackButton — intercepts the hardware/browser back button for modals and overlays.
 *
 * Maintains a global LIFO handler stack. When a modal opens it pushes a history
 * entry and registers a handler; the back button fires only the topmost handler.
 * When a modal closes via a button, history.back() pops the sentinel entry so the
 * browser history stays clean. cleanupBackCount prevents that programmatic call
 * from accidentally triggering the next handler in the stack.
 */

import { useEffect, useRef } from 'react';

type Handler = () => void;

// Module-level singleton — one popstate listener shared across all hook instances.

const handlerStack: Handler[] = [];

// Counts pending programmatic history.back() calls so the listener can ignore them.
let cleanupBackCount = 0;

let initialized = false;

function handlePopState(): void {
  // This popstate was triggered by our own cleanup — ignore it.
  if (cleanupBackCount > 0) {
    cleanupBackCount--;
    return;
  }

  // Fire the topmost registered handler (most-recently-opened modal wins).
  const handler = handlerStack[handlerStack.length - 1];
  if (handler) {
    handlerStack.pop();
    handler();
  }
}

function init(): void {
  if (!initialized) {
    initialized = true;
    window.addEventListener('popstate', handlePopState);
  }
}

/**
 * Drop into any modal or overlay component.
 *
 * @param isOpen  - Whether the layer is currently visible.
 * @param onClose - Callback to close the layer (same one used by the X button).
 *
 * @example
 *   useBackButton(isOpen, onClose);
 *   useBackButton(true, onClose); // always-mounted overlay
 */
export function useBackButton(isOpen: boolean, onClose: () => void): void {
  // Holds the latest onClose without causing effect re-runs.
  const onCloseRef = useRef<Handler>(onClose);
  onCloseRef.current = onClose;

  // True while this instance owns a live history entry that needs cleanup.
  const isPushedRef = useRef(false);

  // True when the back button (not a UI button) triggered the close.
  // Prevents calling history.back() a second time after it already navigated.
  const closedByBackRef = useRef(false);

  useEffect(() => {
    init();

    if (!isOpen) return;

    // ── Open ───────────────────────────────────────────────────────────────
    window.history.pushState({ _vocabModal: true }, '');
    isPushedRef.current = true;
    closedByBackRef.current = false;

    const handler: Handler = () => {
      // Back button fired — history already moved, no need to call back() again.
      closedByBackRef.current = true;
      isPushedRef.current = false;
      onCloseRef.current();
    };

    handlerStack.push(handler);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      // Remove our handler — may already be gone if the back button fired first.
      const idx = handlerStack.lastIndexOf(handler);
      if (idx !== -1) {
        handlerStack.splice(idx, 1);
      }

      // If we still own a live history entry (closed via button, not back),
      // pop it to keep browser history clean.
      if (isPushedRef.current && !closedByBackRef.current) {
        isPushedRef.current = false;
        cleanupBackCount++;
        window.history.back();
      }
    };
  }, [isOpen]);
}
