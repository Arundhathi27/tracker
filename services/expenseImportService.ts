import { BaseService } from './base';
import { budgetService } from './budgetService';
import { paymentMethodService } from './paymentMethodService';
import { transactionService, CreateTransactionDto } from './transactionService';
import { Transaction } from '@/types';

export interface ImportExpenseItem {
  rowNumber: number;
  date: string; // YYYY-MM-DD (Preserved strictly as transaction date)
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
  totalRequested: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  failedRows: FailedImportRow[];
  monthCounts: Record<string, { label: string; count: number }>;
}

class ExpenseImportService extends BaseService {
  /**
   * Fetches all unique category names used across user's budgets for fuzzy matching
   */
  async getAllUserCategoryNames(): Promise<string[]> {
    try {
      const monthlyBudgets = await budgetService.getMonthlyBudgets();
      const nameSet = new Set<string>();

      // Standard BudgetWise categories as baseline
      ['Groceries', 'Rent', 'Vegetables', 'Food', 'Transport', 'Bills', 'Shopping', 'Gifts', 'Health'].forEach(c => nameSet.add(c));

      for (const mb of monthlyBudgets) {
        const cats = await budgetService.getBudgetCategories(mb.id);
        cats.forEach(c => {
          if (c.name) nameSet.add(c.name.trim());
        });
      }
      return Array.from(nameSet);
    } catch {
      return ['Groceries', 'Rent', 'Vegetables', 'Food', 'Transport', 'Bills', 'Shopping', 'Gifts', 'Health'];
    }
  }

  /**
   * Fetches existing transactions for duplicate detection
   */
  async getExistingUserTransactions(): Promise<Transaction[]> {
    try {
      return await transactionService.getTransactions({});
    } catch {
      return [];
    }
  }

  /**
   * Resolves monthly budgets and categories for historical import items,
   * then batch inserts expenses into the transactions table.
   * 
   * CORE BUSINESS RULE:
   * Expenses and Budgets are INDEPENDENT.
   * - If a monthly budget exists: use it normally.
   * - If NO monthly budget exists: DO NOT CREATE ONE. DO NOT UPDATE ONE.
   *   JUST SAVE THE EXPENSE.
   */
  async importExpenses(items: ImportExpenseItem[], skippedCount: number = 0): Promise<ImportResultSummary> {
    if (!items || items.length === 0) {
      return {
        totalRequested: 0,
        importedCount: 0,
        skippedCount,
        failedCount: 0,
        failedRows: [],
        monthCounts: {},
      };
    }

    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) throw userError;

    // 1. Group items by exact transaction YYYY-MM (preserving historical date)
    const itemsByMonth: Record<string, ImportExpenseItem[]> = {};
    const monthCounts: Record<string, { label: string; count: number }> = {};

    items.forEach(item => {
      const monthKey = item.date.substring(0, 7); // e.g. "2026-01" for Jan 2026
      if (!itemsByMonth[monthKey]) {
        itemsByMonth[monthKey] = [];
        const d = new Date(item.date + 'T00:00:00');
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthCounts[monthKey] = { label, count: 0 };
      }
      itemsByMonth[monthKey].push(item);
    });

    // 2. Fetch existing payment methods for user
    const paymentMethods = await paymentMethodService.getPaymentMethods();
    const pmMap: Record<string, string> = {};
    paymentMethods.forEach(pm => {
      pmMap[pm.name.toLowerCase().trim()] = pm.id;
    });

    const categoryIdMap: Record<string, Record<string, string>> = {}; // monthKey -> (catNameLower -> catId)

    // 3. Resolve monthly budgets and budget categories per month WITHOUT creating fake budgets
    for (const monthKey of Object.keys(itemsByMonth)) {
      const monthlyBudget = await budgetService.getMonthlyBudgetByMonth(monthKey);
      const catMap: Record<string, string> = {};

      if (monthlyBudget) {
        // IF A MONTHLY BUDGET EXISTS: Use existing budget normally
        const existingCats = await budgetService.getBudgetCategories(monthlyBudget.id);
        existingCats.forEach(c => {
          catMap[c.name.toLowerCase().trim()] = c.id;
        });

        const uniqueCatNames = Array.from(
          new Set(itemsByMonth[monthKey].map(i => i.categoryName.trim()))
        );

        for (const rawCatName of uniqueCatNames) {
          const lowerName = rawCatName.toLowerCase().trim();
          if (!catMap[lowerName]) {
            const newCat = await budgetService.createBudgetCategory({
              monthly_budget_id: monthlyBudget.id,
              name: rawCatName,
              icon: 'HelpCircle',
              color: '#6B4F3A',
              allocated_amount: 0,
            });
            catMap[lowerName] = newCat.id;
          }
        }
      }
      // IF NO MONTHLY BUDGET EXISTS:
      // DO NOT CREATE ONE. DO NOT UPDATE ONE. DO NOT INSERT Fake $0 BUDGET.
      // Transactions will be saved directly in public.transactions.

      categoryIdMap[monthKey] = catMap;
    }

    // 4. Map import items to CreateTransactionDto with original row reference
    const mappedItems: { item: ImportExpenseItem; dto: CreateTransactionDto }[] = items.map(item => {
      const monthKey = item.date.substring(0, 7);
      const catMap = categoryIdMap[monthKey] || {};
      const catId = catMap[item.categoryName.toLowerCase().trim()] || null;

      let pmId: string | null = null;
      if (item.paymentMethodName) {
        pmId = pmMap[item.paymentMethodName.toLowerCase().trim()] || null;
      }

      return {
        item,
        dto: {
          type: 'expense',
          amount: item.amount,
          description: item.description || item.categoryName,
          date: item.date, // Preserves exact transaction date (e.g. 2026-01-15)
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
        const inserted = await transactionService.createTransactionsBatch(dtosChunk);
        if (inserted) {
          importedCount += inserted.length;
          inserted.forEach(tx => {
            const mKey = tx.date.substring(0, 7);
            if (monthCounts[mKey]) {
              monthCounts[mKey].count += 1;
            }
          });
        }
      } catch (err: any) {
        // Fallback: If batch insert fails, insert individually to isolate failed rows
        for (const entry of chunk) {
          try {
            const single = await transactionService.createTransaction(entry.dto);
            if (single) {
              importedCount += 1;
              const mKey = single.date.substring(0, 7);
              if (monthCounts[mKey]) {
                monthCounts[mKey].count += 1;
              }
            }
          } catch (singleErr: any) {
            failedRows.push({
              rowNumber: entry.item.rowNumber,
              item: entry.item,
              errorReason: singleErr.message || 'Failed to insert transaction row',
            });
          }
        }
      }
    }

    return {
      totalRequested: items.length,
      importedCount,
      skippedCount,
      failedCount: failedRows.length,
      failedRows,
      monthCounts,
    };
  }
}

export const expenseImportService = new ExpenseImportService();
