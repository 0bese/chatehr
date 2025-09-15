import { useState, useEffect } from 'react';

/**
 * A custom hook that persists state to localStorage
 * @param key - The localStorage key
 * @param defaultValue - The default value if nothing is stored
 * @returns [state, setState] - Similar to useState but persisted
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }

    return defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}