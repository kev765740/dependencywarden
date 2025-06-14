/**
 * Application Constants
 * Centralized configuration and constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user',
    REFRESH: '/api/auth/refresh',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email'
  },
  REPOSITORIES: {
    LIST: '/api/repositories',
    CREATE: '/api/repositories',
    DETAILS: (id: string) => `/api/repositories/${id}`,
    SCAN: (id: string) => `/api/repositories/${id}/scan`,
    ALERTS: (id: string) => `/api/repositories/${id}/alerts`
  },
  SECURITY: {
    ALERTS: '/api/alerts',
    VULNERABILITIES: '/api/vulnerabilities',
    DEPENDENCIES: '/api/dependencies',
    SCANS: '/api/scans'
  },
  BILLING: {
    PLANS: '/api/billing/plans',
    SUBSCRIPTION: '/api/billing/subscription',
    USAGE: '/api/billing/usage',
    INVOICES: '/api/billing/invoices'
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    REPORTS: '/api/analytics/reports',
    METRICS: '/api/analytics/metrics'
  }
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'DependencyWarden',
  VERSION: '1.0.0',
  DESCRIPTION: 'Advanced Security & Dependency Management Platform',
  SUPPORT_EMAIL: 'support@dependencywarden.com',
  DOCUMENTATION_URL: 'https://docs.dependencywarden.com',
  GITHUB_URL: 'https://github.com/dependencywarden',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_REPOSITORIES: {
    FREE: 5,
    PRO: 50,
    ENTERPRISE: 500
  },
  SCAN_INTERVALS: {
    HOURLY: 'hourly',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MANUAL: 'manual'
  }
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    UPPERCASE: true,
    LOWERCASE: true,
    NUMBERS: true,
    SPECIAL_CHARS: true
  },
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_REFRESH_THRESHOLD: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  CSRF_TOKEN_NAME: 'X-CSRF-Token'
} as const;

// UI Constants
export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: 'hsl(221, 83%, 53%)',
    SECONDARY: 'hsl(210, 40%, 98%)',
    SUCCESS: 'hsl(142, 76%, 36%)',
    WARNING: 'hsl(38, 92%, 50%)',
    DANGER: 'hsl(0, 84%, 60%)',
    INFO: 'hsl(199, 89%, 48%)'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  ANIMATIONS: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms'
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080
  }
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ANALYTICS: true,
  AI_SECURITY: true,
  ENTERPRISE_FEATURES: true,
  BETA_FEATURES: false,
  EXPERIMENTAL_UI: false,
  ADVANCED_MONITORING: true,
  COMPLIANCE_REPORTS: true,
  TEAM_COLLABORATION: true
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: {
    CONNECTION_LOST: 'Connection lost. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    RATE_LIMITED: 'Too many requests. Please wait before trying again.'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    ACCESS_DENIED: 'Access denied. You do not have permission.',
    ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed attempts.'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    WEAK_PASSWORD: 'Password must meet security requirements.',
    PASSWORDS_NO_MATCH: 'Passwords do not match.'
  },
  GENERAL: {
    UNEXPECTED_ERROR: 'An unexpected error occurred.',
    NOT_FOUND: 'The requested resource was not found.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.'
  }
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Welcome back!',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    REGISTER_SUCCESS: 'Account created successfully.',
    PASSWORD_RESET: 'Password reset successfully.'
  },
  REPOSITORIES: {
    ADDED_SUCCESS: 'Repository added successfully.',
    SCAN_STARTED: 'Security scan started.',
    UPDATED_SUCCESS: 'Repository updated successfully.'
  },
  SETTINGS: {
    SAVED_SUCCESS: 'Settings saved successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.'
  }
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: {
    GOOD: 2000,
    NEEDS_IMPROVEMENT: 4000
  },
  BUNDLE_SIZE: {
    WARNING: 1024 * 1024, // 1MB
    ERROR: 2 * 1024 * 1024 // 2MB
  },
  API_RESPONSE: {
    FAST: 200,
    ACCEPTABLE: 1000,
    SLOW: 3000
  }
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  DASHBOARD_LAYOUT: 'dashboard_layout',
  TOUR_COMPLETED: 'tour_completed'
} as const;

export default {
  API_ENDPOINTS,
  APP_CONFIG,
  SECURITY_CONFIG,
  UI_CONSTANTS,
  FEATURE_FLAGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PERFORMANCE_THRESHOLDS,
  STORAGE_KEYS
};