import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  transactionService, 
  CreateTransactionDto, 
  UpdateTransactionDto,
  TransactionFilters
} from '@/services/transactionService';
import { BUDGET_KEYS } from './useBudgets';
import { PAYMENT_METHODS_KEYS } from './usePaymentMethods';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...TRANSACTION_KEYS.lists(), filters] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.all, 'detail', id] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: () => transactionService.getTransactions(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id),
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTransactionDto) => {
      const res = await transactionService.createTransaction(dto);
      console.log('--- After Supabase insert ---');
      return res;
    },
    onSuccess: (_, variables) => {
      console.log('--- Inside onSuccess() ---');
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
      console.log('--- After invalidateQueries() ---');
    },
    onError: (err) => {
      console.log('--- Inside onError() ---', err);
    }
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      transactionService.updateTransaction(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
    },
  });
}
