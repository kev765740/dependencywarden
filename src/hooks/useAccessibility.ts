/**
 * Accessibility Hooks
 * Production-ready accessibility features and helpers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusTrap, useScreenReader, useKeyboardNavigation, useReducedMotion } from '@/lib/accessibilityHelpers';

// Skip navigation hook
export function useSkipNavigation() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const handleSkipToContent = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      mainContentRef.current?.focus();
    }
  }, []);

  return {
    skipLinkRef,
    mainContentRef,
    handleSkipToContent,
    skipLinkProps: {
      ref: skipLinkRef,
      href: '#main-content',
      className: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2',
      onKeyDown: handleSkipToContent,
      children: 'Skip to main content'
    },
    mainContentProps: {
      ref: mainContentRef,
      id: 'main-content',
      tabIndex: -1,
      'aria-label': 'Main content'
    }
  };
}

// Live announcements hook
export function useLiveAnnouncements() {
  const { announcement, announce } = useScreenReader();
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announceMessage = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    persist = false
  ) => {
    announce(message, priority);
    
    if (persist) {
      setAnnouncements(prev => [...prev, message]);
    }
  }, [announce]);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    currentAnnouncement: announcement,
    persistedAnnouncements: announcements,
    announceMessage,
    clearAnnouncements
  };
}

// Modal accessibility hook
export function useModalAccessibility(isOpen: boolean) {
  const modalRef = useFocusTrap(isOpen);
  const { announceMessage } = useLiveAnnouncements();
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      setPreviousFocus(document.activeElement as HTMLElement);
      
      // Announce modal opening
      announceMessage('Modal dialog opened', 'assertive');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous focus
      if (previousFocus) {
        previousFocus.focus();
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Announce modal closing
      announceMessage('Modal dialog closed', 'polite');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, previousFocus, announceMessage]);

  // Keyboard navigation
  useKeyboardNavigation(
    undefined, // Enter handler
    () => {
      if (isOpen) {
        // Close modal on Escape
        // This would be connected to the modal's onClose prop
      }
    }
  );

  return {
    modalRef,
    modalProps: {
      ref: modalRef,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
      'aria-describedby': 'modal-description'
    }
  };
}

// Form accessibility hook
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announceMessage } = useLiveAnnouncements();

  const announceFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    announceMessage(`${fieldName}: ${error}`, 'assertive');
  }, [announceMessage]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const getFieldProps = useCallback((fieldName: string, options: {
    label?: string;
    required?: boolean;
    description?: string;
  } = {}) => {
    const error = errors[fieldName];
    const errorId = error ? `${fieldName}-error` : undefined;
    const descriptionId = options.description ? `${fieldName}-description` : undefined;
    
    return {
      id: fieldName,
      name: fieldName,
      'aria-label': options.label,
      'aria-required': options.required,
      'aria-invalid': !!error,
      'aria-describedby': [errorId, descriptionId].filter(Boolean).join(' ') || undefined,
      'aria-errormessage': errorId
    };
  }, [errors]);

  return {
    errors,
    announceFieldError,
    clearFieldError,
    getFieldProps,
    hasErrors: Object.keys(errors).length > 0
  };
}

// Data table accessibility hook
export function useTableAccessibility(data: any[], columns: any[]) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { announceMessage } = useLiveAnnouncements();

  const handleSort = useCallback((columnKey: string) => {
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    
    announceMessage(
      `Table sorted by ${columnKey} in ${newDirection}ending order`,
      'polite'
    );
  }, [sortColumn, sortDirection, announceMessage]);

  const getTableProps = useCallback(() => ({
    role: 'table',
    'aria-label': `Data table with ${data.length} rows`,
    'aria-rowcount': data.length + 1, // +1 for header
    'aria-colcount': columns.length
  }), [data.length, columns.length]);

  const getColumnHeaderProps = useCallback((column: any, index: number) => ({
    role: 'columnheader',
    'aria-sort': sortColumn === column.key ? sortDirection : 'none',
    'aria-colindex': index + 1,
    tabIndex: 0,
    onClick: () => handleSort(column.key),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSort(column.key);
      }
    }
  }), [sortColumn, sortDirection, handleSort]);

  const getRowProps = useCallback((index: number) => ({
    role: 'row',
    'aria-rowindex': index + 2, // +2 because header is row 1
  }), []);

  const getCellProps = useCallback((columnIndex: number) => ({
    role: 'cell',
    'aria-colindex': columnIndex + 1
  }), []);

  return {
    sortColumn,
    sortDirection,
    getTableProps,
    getColumnHeaderProps,
    getRowProps,
    getCellProps,
    handleSort
  };
}

// Theme and preferences hook
export function useAccessibilityPreferences() {
  const prefersReducedMotion = useReducedMotion();
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  // Detect high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    root.setAttribute('data-font-size', fontSize);
  }, [prefersReducedMotion, highContrast, fontSize]);

  return {
    prefersReducedMotion,
    highContrast,
    fontSize,
    setFontSize,
    preferences: {
      prefersReducedMotion,
      highContrast,
      fontSize
    }
  };
}

export default {
  useSkipNavigation,
  useLiveAnnouncements,
  useModalAccessibility,
  useFormAccessibility,
  useTableAccessibility,
  useAccessibilityPreferences
};