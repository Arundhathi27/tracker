/**
 * Application-wide constants
 */

export const APP_NAME = 'BudgetWise';
export const APP_VERSION = '1.0.0';

// API
export const API_TIMEOUT_MS = 15000;

// Pagination
export const PAGE_SIZE = 20;

// Currency
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

// Date formats
export const DATE_FORMAT_DISPLAY = 'MMM dd, yyyy';
export const DATE_FORMAT_SHORT = 'MMM dd';
export const DATE_FORMAT_MONTH = 'MMMM yyyy';
export const DATE_FORMAT_ISO = 'yyyy-MM-dd';

// Budget periods
export const BUDGET_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

// Transaction types
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'budgetwise_auth_token',
  REFRESH_TOKEN: 'budgetwise_refresh_token',
  USER_PREFERENCES: 'budgetwise_user_prefs',
  ONBOARDING_COMPLETE: 'budgetwise_onboarding',
} as const;

// Query keys
export const QUERY_KEYS = {
  USER: ['user'],
  BUDGETS: ['budgets'],
  EXPENSES: ['expenses'],
  REPORTS: ['reports'],
  NOTIFICATIONS: ['notifications'],
  CATEGORIES: ['categories'],
} as const;
