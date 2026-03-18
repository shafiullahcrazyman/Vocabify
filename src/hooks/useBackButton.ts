/**
 * useBackButton — Universal PWA Back Button Manager
 *
 * How it works:
 *   - Maintains a global handler stack (LIFO). Each open modal/overlay
 *     pushes a handler; only the TOP handler fires when back is pressed.
 *   - When a modal opens  → pushState so the back button intercepts here.
 *   - When back is pressed → fires the topmost handler (closes that modal).
 *   - When a modal closes via button → calls history.back() to pop the
 *     sentinel entry we pushed, keeping browser history clean.
 *   - cleanupBackCount prevents that programmatic history.back() from
 *     accidentally triggering the next handler in the stack.
 *
 * Supports any depth of nested modals correctly (e.g. TipsOverlay inside
 * WordOverlay inside the main screen).
 */

import { useEffect, useRef } from 'react';

type Handler = () => void;

// ─── Module-level singleton ───────────────────────────────────────────────────

const handlerStack: Handler[] = [];

/**
 * Counts how many programmatic `history.back()` calls we are waiting for.
 * Each one increments the counter; the corresponding popstate decrements it
 * and returns early so it doesn't trigger a real close.
 */
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Drop this into any modal/overlay component.
 *
 * @param isOpen  - Reactive boolean controlling whether the layer is visible.
 * @param onClose - Callback to close the layer (same one you pass to the X button).
 *
 * @example
 *   useBackButton(isOpen, onClose);
 *   useBackButton(true, onClose);   // for always-mounted overlays
 */
export function useBackButton(isOpen: boolean, onClose: () => void): void {
  // Always hold the latest onClose without causing re-runs
  const onCloseRef = useRef<Handler>(onClose);
  onCloseRef.current = onClose;

  /**
   * Did THIS effect instance push a history entry that still needs cleanup?
   * Set to true on push, false when the back button fires (history already moved)
   * or after programmatic cleanup.
   */
  const isPushedRef = useRef(false);

  /**
   * Was this modal closed by the back button (true) or by a button click (false)?
   * When true, we must NOT call history.back() again — the navigation already happened.
   */
  const closedByBackRef = useRef(false);

  useEffect(() => {
    init();

    if (!isOpen) return;

    // ── Open: register ──────────────────────────────────────────────────────
    window.history.pushState({ _vocabModal: true }, '');
    isPushedRef.current = true;
    closedByBackRef.current = false;

    const handler: Handler = () => {
      // Mark that the back button (not a button click) caused this close
      closedByBackRef.current = true;
      isPushedRef.current = false;
      onCloseRef.current();
    };

    handlerStack.push(handler);

    // ── Close / unmount: cleanup ────────────────────────────────────────────
    return () => {
      // Remove our handler — may already be gone if back button fired first
      const idx = handlerStack.lastIndexOf(handler);
      if (idx !== -1) {
        handlerStack.splice(idx, 1);
      }

      // If WE still own a live history entry (closed via button, not back button),
      // pop it so browser history stays clean.
      if (isPushedRef.current && !closedByBackRef.current) {
        isPushedRef.current = false;
        cleanupBackCount++; // tell the listener to ignore the upcoming popstate
        window.history.back();
      }
    };
  }, [isOpen]);
}
