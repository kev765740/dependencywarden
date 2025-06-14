import { useEffect, useRef, useState } from 'react';

// ARIA live region manager
export class LiveRegionManager {
  private static regions: Map<string, HTMLElement> = new Map();

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = `live-region-${priority}`;
    let region = this.regions.get(regionId);

    if (!region) {
      region = document.createElement('div');
      region.id = regionId;
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';

      document.body.appendChild(region);
      this.regions.set(regionId, region);
    }

    // Clear previous message
    region.textContent = '';

    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  static clear(): void {
    this.regions.forEach(region => {
      region.textContent = '';
    });
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  static popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  static moveFocusToNext(): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex].focus();
  }

  static moveFocusToPrevious(): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex].focus();
  }
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    enableArrowKeys?: boolean;
    enableTabTrapping?: boolean;
    onEscape?: () => void;
  } = {}
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (options.onEscape) {
            options.onEscape();
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (options.enableArrowKeys) {
            FocusManager.moveFocusToNext();
            e.preventDefault();
          }
          break;
        case 'ArrowUp':
          if (options.enableArrowKeys) {
            FocusManager.moveFocusToPrevious();
            e.preventDefault();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    let focusCleanup: (() => void) | undefined;
    if (options.enableTabTrapping) {
      focusCleanup = FocusManager.trapFocus(container);
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (focusCleanup) {
        focusCleanup();
      }
    };
  }, [containerRef, options]);
}

// Screen reader utilities
export class ScreenReaderUtils {
  static announcePageChange(title: string): void {
    LiveRegionManager.announce(`Page changed to ${title}`, 'assertive');
  }

  static announceFormError(fieldName: string, error: string): void {
    LiveRegionManager.announce(`Error in ${fieldName}: ${error}`, 'assertive');
  }

  static announceSuccess(message: string): void {
    LiveRegionManager.announce(message, 'polite');
  }

  static announceLoading(message: string = 'Loading'): void {
    LiveRegionManager.announce(message, 'polite');
  }

  static announceLoadingComplete(message: string = 'Loading complete'): void {
    LiveRegionManager.announce(message, 'polite');
  }
}

// Skip link component utilities
export function createSkipLink(targetId: string, label: string): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2';

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  });

  return skipLink;
}

// Color contrast utilities
export class ContrastUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  static meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
}

// Reduced motion utilities
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ARIA attributes helper
export function generateAriaProps(options: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  role?: string;
}) {
  const props: Record<string, any> = {};

  if (options.label) props['aria-label'] = options.label;
  if (options.labelledBy) props['aria-labelledby'] = options.labelledBy;
  if (options.describedBy) props['aria-describedby'] = options.describedBy;
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
  if (options.selected !== undefined) props['aria-selected'] = options.selected;
  if (options.disabled !== undefined) props['aria-disabled'] = options.disabled;
  if (options.invalid !== undefined) props['aria-invalid'] = options.invalid;
  if (options.required !== undefined) props['aria-required'] = options.required;
  if (options.role) props['role'] = options.role;

  return props;
}

// Color contrast validation - Enhanced WCAG compliance
export function validateColorContrast(foreground: string, background: string): {
  isValid: boolean;
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  recommendation?: string;
} {
  const luminance1 = ContrastUtils.getLuminance(ContrastUtils.hexToRgb(foreground)?.r || 0, ContrastUtils.hexToRgb(foreground)?.g || 0, ContrastUtils.hexToRgb(foreground)?.b || 0);
  const luminance2 = ContrastUtils.getLuminance(ContrastUtils.hexToRgb(background)?.r || 0, ContrastUtils.hexToRgb(background)?.g || 0, ContrastUtils.hexToRgb(background)?.b || 0);

  const ratio = (Math.max(luminance1, luminance2) + 0.05) / (Math.min(luminance1, luminance2) + 0.05);

  let recommendation = '';
  if (ratio < 4.5) {
    recommendation = ratio < 3 ? 'Severely low contrast - immediate fix required' : 'Low contrast - improve for accessibility';
  }

  return {
    isValid: ratio >= 4.5,
    ratio: Math.round(ratio * 100) / 100,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail',
    recommendation
  };
}

// WCAG 2.1 AA compliance checker
export function checkWCAGCompliance(): {
  colorContrast: boolean;
  keyboardNavigation: boolean;
  ariaLabels: boolean;
  focusManagement: boolean;
} {
  // Check color contrast on page
  const colorContrast = checkPageColorContrast();

  // Check keyboard navigation
  const keyboardNavigation = checkKeyboardAccessibility();

  // Check ARIA labels
  const ariaLabels = checkAriaLabels();

  // Check focus management
  const focusManagement = checkFocusManagement();

  return {
    colorContrast,
    keyboardNavigation,
    ariaLabels,
    focusManagement
  };
}

function checkPageColorContrast(): boolean {
  // Implementation for checking page-wide color contrast
  const elements = document.querySelectorAll('*');
  let passCount = 0;
  let totalCount = 0;

  elements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      totalCount++;
	  // Convert color to hex format
	  const rgbColor = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	  const hexColor = rgbColor ? "#" + (1 << 24 | parseInt(rgbColor[1]) << 16 | parseInt(rgbColor[2]) << 8 | parseInt(rgbColor[3])).toString(16).slice(1) : color;
	  
	  const rgbBackgroundColor = backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	  const hexBackgroundColor = rgbBackgroundColor ? "#" + (1 << 24 | parseInt(rgbBackgroundColor[1]) << 16 | parseInt(rgbBackgroundColor[2]) << 8 | parseInt(rgbBackgroundColor[3])).toString(16).slice(1) : backgroundColor;
	  
      const result = validateColorContrast(hexColor, hexBackgroundColor);
      if (result.isValid) passCount++;
    }
  });

  return totalCount === 0 || (passCount / totalCount) >= 0.95; // 95% compliance
}

function checkKeyboardAccessibility(): boolean {
  const interactiveElements = document.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );

  return Array.from(interactiveElements).every(element => {
    const tabIndex = element.getAttribute('tabindex');
    return tabIndex !== '-1' && !element.hasAttribute('disabled');
  });
}

function checkAriaLabels(): boolean {
  const requiredAriaElements = document.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]):not([id])'
  );

  return requiredAriaElements.length === 0;
}

function checkFocusManagement(): boolean {
  // Check if focus indicators are visible
  const focusableElements = document.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );

  return Array.from(focusableElements).every(element => {
    const styles = window.getComputedStyle(element, ':focus');
    return styles.outline !== 'none' || styles.boxShadow !== 'none';
  });
}

export default {
  LiveRegionManager,
  FocusManager,
  useKeyboardNavigation,
  ScreenReaderUtils,
  createSkipLink,
  ContrastUtils,
  useReducedMotion,
  generateAriaProps,
  validateColorContrast,
  checkWCAGCompliance
};