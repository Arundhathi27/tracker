/**
 * Currency formatting utilities
 */

/**
 * Formats a number as a localized currency string
 * @example formatCurrency(1234.56) → '₹1,234.56'
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a compact currency value
 * @example formatCurrencyCompact(1234567) → '₹1.2M'
 */
export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'INR'
): string => {
  if (Math.abs(amount) >= 1_000_000) {
    return `${formatCurrencySymbol(currency)}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${formatCurrencySymbol(currency)}${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
};

/**
 * Returns the currency symbol for a given currency code
 */
export const formatCurrencySymbol = (currency: string = 'INR'): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'A$',
  };
  return symbols[currency] ?? currency;
};

/**
 * Calculates percentage (safe division)
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

/**
 * Rounds to 2 decimal places
 */
export const roundToTwo = (num: number): number =>
  Math.round((num + Number.EPSILON) * 100) / 100;
