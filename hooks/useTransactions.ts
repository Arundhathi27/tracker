import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  transactionService, 
  CreateTransactionDto, 
  UpdateTransactionDto,
  TransactionFilters
} from '@/services/transactionService';
import { useAuthStore } from '@/store';
import { importService, ImportExpenseItem } from '@/services/importService';

export const TRANSACTION_KEYS = {
  all: (userId?: string) => ['transactions', userId] as const,
  lists: (userId?: string) => ['transactions', 'list', userId] as const,
  list: (filters: TransactionFilters, userId?: string) => ['transactions', 'list', filters, userId] as const,
  detail: (id: string, userId?: string) => ['transactions', 'detail', id, userId] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters, user?.id),
    queryFn: () => transactionService.getTransactions(filters),
    enabled: !!user?.id,
  });
}

export function useTransaction(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id, user?.id),
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!user?.id && !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTransactionDto) => {
      const res = await transactionService.createTransaction(dto);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCreateTransactionsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dtos: CreateTransactionDto[]) => {
      const res = await transactionService.createTransactionsBatch(dtos);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useImportExpenses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: ImportExpenseItem[]) => {
      const res = await importService.importExpenses(items);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      transactionService.updateTransaction(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteTransactionsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => transactionService.deleteTransactionsBatch(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
      queryClient.invalidateQueries({ queryKey: ['spending_insights'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
