/**
 * Duplicate Detection Utility for BudgetWise Bulk Expense Import
 */
import { Transaction } from '@/types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingTransaction?: Transaction;
}

/**
 * Checks if an imported expense item matches an existing user transaction.
 * Criteria: same date (YYYY-MM-DD), same amount, same category name.
 */
export function checkIsDuplicate(
  importedItem: { date: string; amount: number; categoryName: string; description?: string },
  existingTransactions: Transaction[]
): DuplicateCheckResult {
  if (!existingTransactions || existingTransactions.length === 0) {
    return { isDuplicate: false };
  }

  const normCat = importedItem.categoryName.trim().toLowerCase();

  const match = existingTransactions.find(tx => {
    // 1. Same date
    if (tx.date !== importedItem.date) return false;

    // 2. Same amount (allowing 0.01 precision rounding)
    if (Math.abs(tx.amount - importedItem.amount) > 0.01) return false;

    // 3. Same category name
    const txCatName = (tx.category?.name || '').trim().toLowerCase();
    if (txCatName && txCatName === normCat) {
      return true;
    }

    // 4. Same description fallback if uncategorized
    if (tx.description && importedItem.description) {
      if (tx.description.trim().toLowerCase() === importedItem.description.trim().toLowerCase()) {
        return true;
      }
    }

    return false;
  });

  if (match) {
    return {
      isDuplicate: true,
      existingTransaction: match,
    };
  }

  return { isDuplicate: false };
}
