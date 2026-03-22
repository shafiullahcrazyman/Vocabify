import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // SMART SELF-HEALING: If data is corrupted, wipe it and use defaults.
      console.warn(`[Vocabify Cache] Corrupted data found for "${key}". Auto-healing...`);
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only update if the changed key matches this hook's key
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`[Vocabify Cache] Failed to parse sync data for "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    // Use the functional updater form of setStoredValue so we always operate
    // on the latest state — never a stale closure snapshot.
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