import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'phillypulse:';

/**
 * useState that survives app restarts (AsyncStorage on phones, localStorage on web).
 * Starts at `initial`, then switches to the saved value once it loads.
 */
export function usePreference<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(PREFIX + key)
      .then((raw) => {
        if (alive && raw !== null) setValue(JSON.parse(raw) as T);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      AsyncStorage.setItem(PREFIX + key, JSON.stringify(next)).catch(() => {});
    },
    [key],
  );

  return [value, update];
}
