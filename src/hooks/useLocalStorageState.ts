import { useState, useEffect } from 'react';

/**
 * A custom hook to manage state that is persisted in localStorage.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save state to localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}
