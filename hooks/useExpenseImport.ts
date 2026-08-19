import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseImportService, ImportExpenseItem, ImportResultSummary } from '@/services/expenseImportService';

export function useExpenseImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, skippedCount }: { items: ImportExpenseItem[]; skippedCount: number }): Promise<ImportResultSummary> => {
      return await expenseImportService.importExpenses(items, skippedCount);
    },
    onSuccess: () => {
      // PHASE 12: Invalidate all relevant React Query keys so imported transactions
      // immediately populate Activity, Category spending, Monthly budgets, Budget Status, Reports, and Spending Insights!
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
}
