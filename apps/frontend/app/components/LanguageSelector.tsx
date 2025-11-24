'use client';

import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Tooltip from './Tooltip';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { currentLanguage, setCurrentLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLanguageName = 
    supportedLanguages.find((lang) => lang.language === currentLanguage)?.name || 
    currentLanguage.toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {showLabel && (
        <label 
          htmlFor="language-selector" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Language
        </label>
      )}
      
      {/* Dropdown Button */}
      <button
        id="language-selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          <Tooltip text="Select language" position="bottom">
            <svg
              className="w-5 h-5 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </Tooltip>
          {currentLanguageName}
        </span>
        <Tooltip text={isOpen ? "Close language menu" : "Open language menu"} position="bottom">
          <svg
            className={`w-5 h-5 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Tooltip>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div className="absolute z-20 w-64 mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
            <div className="py-1" role="menu">
              {supportedLanguages.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Loading languages...
                </div>
              ) : (
                supportedLanguages.map((language) => (
                  <button
                    key={language.language}
                    onClick={() => handleLanguageChange(language.language)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      currentLanguage === language.language
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-center justify-between">
                      <span>{language.name}</span>
                      {currentLanguage === language.language && (
                        <Tooltip text="Current language" position="left">
                          <svg
                            className="w-4 h-4 text-blue-700"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Tooltip>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

