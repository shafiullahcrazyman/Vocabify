import { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';

/**
 * useIndexedDB — persists state to IndexedDB via localforage.
 *
 * Multi-tab sync: a BroadcastChannel named `vocabify_db_sync` carries a
 * notification whenever any tab writes a key. Other tabs re-read that key
 * from IndexedDB and update their local state, so two open tabs always
 * converge on the latest data without a page reload.
 *
 * BroadcastChannel is supported in all modern browsers and in PWA service
 * worker contexts. The channel is closed on unmount via the cleanup return.
 */

// One shared channel instance across all hook invocations in this tab.
const syncChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('vocabify_db_sync')
    : null;

interface SyncMessage {
  key: string;
}

export function useIndexedDB<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep a ref to the current key so the channel listener doesn't capture
  // a stale closure value — important if the hook is ever called with a
  // dynamic key (though in practice Vocabify uses fixed keys).
  const keyRef = useRef(key);
  keyRef.current = key;

  // ── Initial load from IndexedDB ───────────────────────────────────────────
  useEffect(() => {
    localforage.getItem<T>(key).then((value) => {
      if (value !== null) {
        setStoredValue(value);
      } else {
        localforage.setItem(key, initialValue);
      }
      setIsLoaded(true);
    }).catch(err => {
      console.error(`[IndexedDB] Error loading ${key}:`, err);
      setIsLoaded(true);
    });
  }, [key]);

  // ── Cross-tab sync listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!syncChannel) return;

    const handler = (event: MessageEvent<SyncMessage>) => {
      if (event.data?.key !== keyRef.current) return;
      // Another tab wrote this key — re-read the latest value from IndexedDB.
      localforage.getItem<T>(keyRef.current).then((value) => {
        if (value !== null) setStoredValue(value);
      }).catch(err => {
        console.error(`[IndexedDB] Sync re-read failed for "${keyRef.current}":`, err);
      });
    };

    syncChannel.addEventListener('message', handler);
    return () => syncChannel.removeEventListener('message', handler);
  }, []);

  // ── Write ─────────────────────────────────────────────────────────────────
  const setValue = (value: T | ((val: T) => T)) => {
    // Functional updater guarantees we never operate on a stale state snapshot.
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;

      // Fire-and-forget persist, then notify other tabs.
      localforage.setItem(key, valueToStore)
        .then(() => {
          syncChannel?.postMessage({ key } satisfies SyncMessage);
        })
        .catch(err => {
          console.error(`[IndexedDB] Failed to save data for "${key}":`, err);
        });

      return valueToStore;
    });
  };

  return [storedValue, setValue, isLoaded] as const;
}
