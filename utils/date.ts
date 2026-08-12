/**
 * Date utilities for BudgetWise
 */

/**
 * Formats a date string or Date object into a display-friendly string
 * @example formatDate('2024-01-15') → 'Jan 15, 2024'
 */
export const formatDate = (
  date: string | Date,
  format: 'display' | 'short' | 'month' | 'relative' = 'display'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid date';

  const now = new Date();

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    case 'month':
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    case 'relative': {
      const diff = now.getTime() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      if (days < 365) return `${Math.floor(days / 30)} months ago`;
      return `${Math.floor(days / 365)} years ago`;
    }

    case 'display':
    default:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  }
};

/**
 * Returns the start and end date of the current month
 */
export const getCurrentMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

/**
 * Returns an ISO date string (YYYY-MM-DD) for a given Date in LOCAL time
 */
export const toISODate = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns an ISO month string (YYYY-MM) for a given Date in LOCAL time
 */
export const toISOMonth = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Checks if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};
