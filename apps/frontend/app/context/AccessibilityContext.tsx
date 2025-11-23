'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');

  // Load preferences from localStorage and system preferences
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') as 'normal' | 'large' | 'extra-large' || 'normal';
    
    setHighContrast(savedHighContrast);
    setFontSize(savedFontSize);

    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const savedReducedMotion = localStorage.getItem('reducedMotion');
    
    if (savedReducedMotion !== null) {
      setReducedMotion(savedReducedMotion === 'true');
    } else {
      setReducedMotion(mediaQuery.matches);
    }

    // Listen for changes in system preference
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('reducedMotion') === null) {
        setReducedMotion(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${fontSize}`);
  }, [highContrast, reducedMotion, fontSize]);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', String(newValue));
    announceToScreenReader(
      newValue ? 'High contrast mode enabled' : 'High contrast mode disabled'
    );
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reducedMotion', String(newValue));
    announceToScreenReader(
      newValue ? 'Reduced motion enabled' : 'Reduced motion disabled'
    );
  };

  const handleSetFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    const sizeLabels = {
      normal: 'Normal',
      large: 'Large',
      'extra-large': 'Extra large'
    };
    announceToScreenReader(`Font size set to ${sizeLabels[size]}`);
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setAnnouncementPriority(priority);
    // Small delay to ensure the announcement is picked up by screen readers
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        reducedMotion,
        fontSize,
        toggleHighContrast,
        toggleReducedMotion,
        setFontSize: handleSetFontSize,
        announceToScreenReader,
      }}
    >
      {children}
      {/* Screen reader announcement region */}
      <div
        role="status"
        aria-live={announcementPriority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

