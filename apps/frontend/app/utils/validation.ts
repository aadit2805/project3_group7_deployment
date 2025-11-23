/**
 * Form validation utilities with descriptive error messages for accessibility
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email address is required. Please enter a valid email address.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error:
        'Email address is not valid. Please enter a valid email in the format: example@domain.com',
    };
  }

  return { isValid: true };
};

export const validateRequired = (
  value: string,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} is required. Please provide a ${fieldName.toLowerCase()}.`,
    };
  }

  return { isValid: true };
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long. Current length: ${value.length} characters.`,
    };
  }

  return { isValid: true };
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters. Current length: ${value.length} characters. Please shorten your input.`,
    };
  }

  return { isValid: true };
};

export const validateNumber = (
  value: string,
  fieldName: string
): { isValid: boolean; error?: string } => {
  const num = Number(value);
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number. Please enter only numeric digits.`,
    };
  }

  return { isValid: true };
};

export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName} must be between ${min} and ${max}. You entered ${value}. Please enter a value within the valid range.`,
    };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required. Please enter a valid phone number.',
    };
  }

  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      error:
        'Phone number contains invalid characters. Please use only numbers, spaces, hyphens, parentheses, and plus signs.',
    };
  }

  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: `Phone number must contain at least 10 digits. You entered ${digitsOnly.length} digits. Please provide a complete phone number.`,
    };
  }

  return { isValid: true };
};

export const validateSelection = (
  selections: any[],
  required: number,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (selections.length < required) {
    return {
      isValid: false,
      error: `Please select ${required} ${fieldName}${required !== 1 ? 's' : ''}. You have selected ${selections.length}. ${required - selections.length} more ${fieldName}${required - selections.length !== 1 ? 's are' : ' is'} needed.`,
    };
  }

  return { isValid: true };
};

/**
 * Component for displaying validation errors in an accessible manner
 */
export const getErrorProps = (fieldId: string, error?: string) => {
  if (!error) {
    return {};
  }

  return {
    'aria-invalid': 'true' as const,
    'aria-describedby': `${fieldId}-error`,
  };
};

