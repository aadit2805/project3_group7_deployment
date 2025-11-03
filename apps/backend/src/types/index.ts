/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * User type definition
 */
export interface User {
  id: number;
  name: string;
  email?: string;
}

/**
 * Request body type for user creation
 */
export interface CreateUserRequest {
  name: string;
  email?: string;
}

