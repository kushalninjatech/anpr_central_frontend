/**
 * Application Configuration
 *
 * Centralized configuration for environment variables.
 * All values are loaded from .env file with VITE_ prefix.
 */

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8010',

  // Application
  projectName: import.meta.env.VITE_PROJECT_NAME || 'ANPR Central',

  // Environment
  env: import.meta.env.VITE_ENV || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
