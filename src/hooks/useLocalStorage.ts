import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = console.error,
  } = options;

  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to read from storage'));
      return initialValue;
    }
  }, [key, initialValue, deserialize, onError]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to local storage
        window.localStorage.setItem(key, serialize(newValue));

        // Save state
        setStoredValue(newValue);

        // We dispatch a custom event so every useLocalStorage hook are notified
        window.dispatchEvent(new Event('local-storage'));
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to save to storage'));
      }
    },
    [key, serialize, storedValue, onError]
  );

  // Listen for changes to this local storage key in other documents/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          onError(error instanceof Error ? error : new Error('Failed to parse storage item'));
        }
      }
    };

    // this only works for other documents, not the current one
    window.addEventListener('storage', handleStorageChange);
    // this is a custom event, triggered in setValue
    window.addEventListener('local-storage', () => {
      setStoredValue(readValue());
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', () => {
        setStoredValue(readValue());
      });
    };
  }, [key, readValue, deserialize, onError]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to remove from storage'));
    }
  }, [key, initialValue, onError]);

  return [storedValue, setValue, remove] as const;
}

// Example usage:
// interface User {
//   id: number;
//   name: string;
//   email: string;
// }
//
// function UserProfile() {
//   const [user, setUser, removeUser] = useLocalStorage<User | null>(
//     'user',
//     null,
//     {
//       onError: (error) => {
//         console.error('Storage error:', error);
//         // Show error notification
//       }
//     }
//   );
//
//   return (
//     <div>
//       {user ? (
//         <>
//           <h1>{user.name}</h1>
//           <button onClick={() => removeUser()}>Logout</button>
//         </>
//       ) : (
//         <button onClick={() => setUser({ id: 1, name: 'John', email: 'john@example.com' })}>
//           Login
//         </button>
//       )}
//     </div>
//   );
// } 