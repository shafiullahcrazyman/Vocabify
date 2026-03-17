import { useState, useEffect } from 'react';
import localforage from 'localforage';

export function useIndexedDB<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const setValue = (value: T | ((val: T) => T)) => {
    // We use React's 'prev' to absolutely guarantee we never use a stale state
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      
      // Fire and forget save to IndexedDB in the background
      localforage.setItem(key, valueToStore).catch(err => {
        console.error(`[IndexedDB] Failed to save data for "${key}":`, err);
      });
      
      return valueToStore;
    });
  };

  return [storedValue, setValue, isLoaded] as const;
}