import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Corrupted data — clear it and fall back to defaults.
      console.warn(`[Vocabify Cache] Corrupted data found for "${key}". Auto-healing...`);
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    // Functional updater avoids writing a stale value.
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`[Vocabify Cache] Failed to save data for "${key}":`, error);
      }
      return valueToStore;
    });
  };

  return [storedValue, setValue] as const;
}
