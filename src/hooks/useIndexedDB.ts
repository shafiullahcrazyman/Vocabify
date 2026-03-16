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

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Update React state immediately for a snappy UI
      setStoredValue(valueToStore);
      // Save to IndexedDB asynchronously in the background so it never freezes
      await localforage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`[IndexedDB] Failed to save data for "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}