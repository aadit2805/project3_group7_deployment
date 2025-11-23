'use client';

import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to manage keyboard navigation within a container
 * Ensures consistent logical tab order and arrow key navigation
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  containerRef: RefObject<T>,
  options: {
    enableArrowKeys?: boolean;
    enableHomeEnd?: boolean;
    enableEscape?: boolean;
    onEscape?: () => void;
    selector?: string;
  } = {}
) {
  const {
    enableArrowKeys = true,
    enableHomeEnd = true,
    enableEscape = false,
    onEscape,
    selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll(selector)
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      if (enableArrowKeys && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        const nextIndex =
          event.key === 'ArrowDown'
            ? (currentIndex + 1) % focusableElements.length
            : currentIndex <= 0
            ? focusableElements.length - 1
            : currentIndex - 1;
        focusableElements[nextIndex]?.focus();
      }

      if (enableHomeEnd && event.key === 'Home') {
        event.preventDefault();
        focusableElements[0]?.focus();
      }

      if (enableHomeEnd && event.key === 'End') {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }

      if (enableEscape && event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enableArrowKeys, enableHomeEnd, enableEscape, onEscape, selector]);
}

/**
 * Hook to trap focus within a modal or dialog
 * Ensures keyboard users cannot tab out of the modal
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T>,
  isActive: boolean = true
) {
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    firstFocusableRef.current = focusableElements[0];
    lastFocusableRef.current = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstFocusableRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableRef.current) {
          event.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableRef.current) {
          event.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);

  return { firstFocusableRef, lastFocusableRef };
}

/**
 * Hook to ensure an element is focused when mounted
 * Useful for managing focus in single-page applications
 */
export function useAutoFocus<T extends HTMLElement>(
  elementRef: RefObject<T>,
  shouldFocus: boolean = true
) {
  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [elementRef, shouldFocus]);
}

/**
 * Hook to restore focus to a previous element
 * Useful when closing modals or navigating back
 */
export function useFocusRestore() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousActiveElement.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  };

  return { saveFocus, restoreFocus };
}

