import { useEffect, useCallback } from 'react';

type KeyboardKey = string;
type Modifier = 'ctrl' | 'alt' | 'shift' | 'meta';
type KeyCombo = {
  key: KeyboardKey;
  modifiers?: Modifier[];
};

type ShortcutCallback = (event: KeyboardEvent) => void;

interface ShortcutOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(
  keyCombo: KeyCombo | KeyCombo[],
  callback: ShortcutCallback,
  options: ShortcutOptions = {}
) {
  const {
    preventDefault = true,
    stopPropagation = true,
    enabled = true,
  } = options;

  const combos = Array.isArray(keyCombo) ? keyCombo : [keyCombo];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchingCombo = combos.find((combo) => {
        const keyMatch = event.key.toLowerCase() === combo.key.toLowerCase();
        if (!keyMatch) return false;

        const modifiers = combo.modifiers || [];
        const modifierMatch =
          (modifiers.includes('ctrl') === event.ctrlKey) &&
          (modifiers.includes('alt') === event.altKey) &&
          (modifiers.includes('shift') === event.shiftKey) &&
          (modifiers.includes('meta') === event.metaKey);

        return modifierMatch;
      });

      if (matchingCombo) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callback(event);
      }
    },
    [callback, combos, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Example usage:
// useKeyboardShortcut(
//   { key: 's', modifiers: ['ctrl'] },
//   (event) => {
//     console.log('Ctrl+S pressed');
//   }
// );
//
// useKeyboardShortcut(
//   [
//     { key: 'Enter', modifiers: ['ctrl'] },
//     { key: 'Enter', modifiers: ['meta'] }
//   ],
//   (event) => {
//     console.log('Ctrl/Cmd+Enter pressed');
//   }
// ); 