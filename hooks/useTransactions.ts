import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  transactionService, 
  CreateTransactionDto, 
  UpdateTransactionDto,
  TransactionFilters
} from '@/services/transactionService';
import { useAuthStore } from '@/store';

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
    },
  });
}
