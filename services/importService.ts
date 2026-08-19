import { BaseService } from './base';
import { expenseImportService, ImportExpenseItem, ImportResultSummary } from './expenseImportService';

export type { ImportExpenseItem, ImportResultSummary };

class ImportService extends BaseService {
  async getAllUserCategoryNames(): Promise<string[]> {
    return await expenseImportService.getAllUserCategoryNames();
  }

  async importExpenses(items: ImportExpenseItem[], skippedCount: number = 0): Promise<ImportResultSummary> {
    return await expenseImportService.importExpenses(items, skippedCount);
  }
}

export const importService = new ImportService();
