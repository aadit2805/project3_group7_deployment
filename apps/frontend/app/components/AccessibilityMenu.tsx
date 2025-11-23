'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useFocusTrap } from '../hooks/useKeyboardNavigation';
import Link from 'next/link';
import Tooltip from './Tooltip';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
  } = useAccessibility();

  // Trap focus within the panel when open
  useFocusTrap(panelRef, isOpen);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
        aria-haspopup="dialog"
      >
        <Tooltip text="Accessibility settings" position="left">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </Tooltip>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          id="accessibility-panel"
          className="absolute bottom-16 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-6 w-80"
          role="dialog"
          aria-label="Accessibility settings panel"
          aria-modal="true"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Accessibility</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
              aria-label="Close accessibility settings"
            >
              <Tooltip text="Close accessibility settings" position="bottom">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Tooltip>
            </button>
          </div>

          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700">
                High Contrast
              </label>
              <button
                id="high-contrast"
                role="switch"
                aria-checked={highContrast}
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  highContrast ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700">
                Reduced Motion
              </label>
              <button
                id="reduced-motion"
                role="switch"
                aria-checked={reducedMotion}
                onClick={toggleReducedMotion}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Font Size</legend>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="font-size"
                    value="normal"
                    checked={fontSize === 'normal'}
                    onChange={() => setFontSize('normal')}
                    className="mr-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Normal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="font-size"
                    value="large"
                    checked={fontSize === 'large'}
                    onChange={() => setFontSize('large')}
                    className="mr-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Large</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="font-size"
                    value="extra-large"
                    checked={fontSize === 'extra-large'}
                    onChange={() => setFontSize('extra-large')}
                    className="mr-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Extra Large</span>
                </label>
              </div>
            </fieldset>

            {/* Link to full accessibility statement */}
            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/accessibility"
                className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsOpen(false)}
              >
                View Accessibility Statement
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

