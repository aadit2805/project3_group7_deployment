'use client';

import React from 'react';
import FormError from './FormError';
import { getErrorProps } from '../utils/validation';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  containerClassName?: string;
}

/**
 * Accessible form input component with built-in error handling
 * Provides proper labels, error messages, and ARIA attributes
 */
export default function FormInput({
  label,
  id,
  error,
  helpText,
  containerClassName = '',
  className = '',
  required,
  ...inputProps
}: FormInputProps) {
  const errorProps = getErrorProps(id, error);

  return (
    <div className={`mb-4 ${containerClassName}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {helpText && (
        <p id={`${id}-help`} className="text-sm text-gray-500 mb-1">
          {helpText}
        </p>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 border ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } rounded-md shadow-sm focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
        } focus:border-transparent ${className}`}
        aria-describedby={`${helpText ? `${id}-help` : ''} ${error ? `${id}-error` : ''}`.trim() || undefined}
        required={required}
        {...errorProps}
        {...inputProps}
      />
      <FormError id={`${id}-error`} error={error} />
    </div>
  );
}

