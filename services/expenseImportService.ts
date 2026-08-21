import { budgetService } from './budgetService';
import { paymentMethodService } from './paymentMethodService';
import { transactionService, CreateTransactionDto } from './transactionService';
import { Transaction } from '@/types';

export interface ImportExpenseItem {
  rowNumber: number;
  date: string; // YYYY-MM-DD
  amount: number;
  categoryName: string;
  paymentMethodName?: string;
  description?: string;
}

export interface FailedImportRow {
  rowNumber: number;
  item: ImportExpenseItem;
  errorReason: string;
}

export interface ImportResultSummary {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  failedRows: FailedImportRow[];
  monthCounts: Record<string, { label: string; count: number }>;
}

class ExpenseImportService {
  /**
   * Fetches all unique category names defined across user's existing budgets
   */
  async getAllUserCategoryNames(): Promise<string[]> {
    try {
      const monthlyBudgets = await budgetService.getMonthlyBudgets();
      const nameSet = new Set<string>();

      // Baseline standard categories
      ['Groceries', 'Rent', 'Vegetables', 'Food', 'Transport', 'Travel', 'Bills', 'Shopping', 'Gifts', 'Health', 'Personal Care', 'Housing', 'Fuel', 'Recharge', 'Family', 'Transfer', 'Other'].forEach(c => nameSet.add(c));

      if (monthlyBudgets) {
        for (const mb of monthlyBudgets) {
          if (mb.budget_categories) {
            mb.budget_categories.forEach(c => {
              if (c.name) nameSet.add(c.name.trim());
            });
          }
        }
      }
      return Array.from(nameSet);
    } catch {
      return ['Groceries', 'Rent', 'Vegetables', 'Food', 'Transport', 'Travel', 'Bills', 'Shopping', 'Gifts', 'Health', 'Personal Care', 'Housing', 'Fuel', 'Recharge', 'Family', 'Transfer', 'Other'];
    }
  }

  /**
   * Fetches existing transactions for duplicate detection
   */
  async getExistingUserTransactions(): Promise<Transaction[]> {
    try {
      const txs = await transactionService.getTransactions({ limit: 1000 });
      return txs || [];
    } catch {
      return [];
    }
  }

  /**
   * Imports bulk expenses independently without creating fake budgets or fake categories.
   * Add Budget screen remains the ONLY place where budgets/categories are created.
   */
  async importExpenses(
    items: ImportExpenseItem[],
    skippedCount: number = 0
  ): Promise<ImportResultSummary> {
    if (!items || items.length === 0) {
      return {
        importedCount: 0,
        skippedCount,
        failedCount: 0,
        failedRows: [],
        monthCounts: {},
      };
    }

    // 1. Group items by month (YYYY-MM) based strictly on transaction date
    const itemsByMonth: Record<string, ImportExpenseItem[]> = {};
    items.forEach(item => {
      const monthKey = item.date.substring(0, 7);
      if (!itemsByMonth[monthKey]) {
        itemsByMonth[monthKey] = [];
      }
      itemsByMonth[monthKey].push(item);
    });

    // 2. Fetch user's existing payment methods
    const userPaymentMethods = await paymentMethodService.getPaymentMethods();
    const pmMap: Record<string, string> = {};
    (userPaymentMethods || []).forEach(pm => {
      pmMap[pm.name.toLowerCase().trim()] = pm.id;
    });

    // 3. Resolve category IDs from existing user categories without creating fake budgets or categories
    const allMonthlyBudgets = await budgetService.getMonthlyBudgets();
    const userGlobalCategoryMap: Record<string, string> = {};

    if (allMonthlyBudgets) {
      allMonthlyBudgets.forEach(mb => {
        if (mb.budget_categories) {
          mb.budget_categories.forEach(c => {
            if (c.name) {
              userGlobalCategoryMap[c.name.toLowerCase().trim()] = c.id;
            }
          });
        }
      });
    }

    // 4. Map import items to CreateTransactionDto
    const mappedItems: { item: ImportExpenseItem; dto: CreateTransactionDto }[] = items.map(item => {
      const catLower = item.categoryName.toLowerCase().trim();
      const catId = userGlobalCategoryMap[catLower] || null;

      let pmId: string | null = null;
      if (item.paymentMethodName && item.paymentMethodName.toLowerCase().trim() !== 'not specified') {
        pmId = pmMap[item.paymentMethodName.toLowerCase().trim()] || null;
      }

      return {
        item,
        dto: {
          type: 'expense',
          amount: item.amount,
          description: item.description || item.categoryName,
          date: item.date, // Transaction date determines month
          category_id: catId,
          payment_method_id: pmId,
        },
      };
    });

    // 5. Controlled batch insertion in chunks of 50
    const CHUNK_SIZE = 50;
    let importedCount = 0;
    const failedRows: FailedImportRow[] = [];

    for (let i = 0; i < mappedItems.length; i += CHUNK_SIZE) {
      const chunk = mappedItems.slice(i, i + CHUNK_SIZE);
      const dtosChunk = chunk.map(c => c.dto);

      try {
        const createdTxs = await transactionService.createTransactionsBatch(dtosChunk);
        importedCount += (createdTxs || []).length;
      } catch (err: any) {
        // Fall back to item-by-item insertion to isolate failures
        for (const itemPair of chunk) {
          try {
            await transactionService.createTransaction(itemPair.dto);
            importedCount += 1;
          } catch (singleErr: any) {
            failedRows.push({
              rowNumber: itemPair.item.rowNumber,
              item: itemPair.item,
              errorReason: singleErr.message || 'Database insertion error',
            });
          }
        }
      }
    }

    // 6. Build month breakdown summary
    const monthCounts: Record<string, { label: string; count: number }> = {};
    items.forEach(item => {
      if (!failedRows.some(f => f.rowNumber === item.rowNumber)) {
        const monthKey = item.date.substring(0, 7);
        if (!monthCounts[monthKey]) {
          const d = new Date(item.date + 'T00:00:00');
          const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          monthCounts[monthKey] = { label, count: 0 };
        }
        monthCounts[monthKey].count += 1;
      }
    });

    return {
      importedCount,
      skippedCount,
      failedCount: failedRows.length,
      failedRows,
      monthCounts,
    };
  }
}

export const expenseImportService = new ExpenseImportService();
