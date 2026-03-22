import { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';

/**
 * useIndexedDB — persists state to IndexedDB via localforage.
 *
 * Cross-tab sync: a BroadcastChannel notifies other tabs on every write so
 * they re-read the updated value, keeping all open tabs in sync without a reload.
 */

// One shared channel instance for all hook invocations in this tab.
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

  // Ref keeps the current key accessible inside the channel listener
  // without stale closure issues.
  const keyRef = useRef(key);
  keyRef.current = key;

  // ── Initial load ──────────────────────────────────────────────────────────
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

  // ── Cross-tab sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!syncChannel) return;

    const handler = (event: MessageEvent<SyncMessage>) => {
      if (event.data?.key !== keyRef.current) return;
      // Another tab wrote this key — re-read the latest value.
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
    // Functional updater avoids operating on a stale state snapshot.
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;

      // Persist, then notify other tabs.
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
