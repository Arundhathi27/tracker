import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fixedExpenseService } from '@/services/fixedExpenseService';
import { useAuthStore } from '@/store';

export const FIXED_EXPENSE_KEYS = {
  all: (userId?: string) => ['fixed_expenses', userId] as const,
  list: (userId?: string) => ['fixed_expenses', 'list', userId] as const,
  overrides: (year: number, userId?: string) => ['fixed_expense_overrides', year, userId] as const,
};

export function useFixedExpenses() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: FIXED_EXPENSE_KEYS.list(user?.id),
    queryFn: () => fixedExpenseService.getFixedExpenses(user?.id || ''),
    enabled: !!user?.id,
  });
}

export function useFixedExpenseOverrides(year: number) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: FIXED_EXPENSE_KEYS.overrides(year, user?.id),
    queryFn: () => fixedExpenseService.getOverrides(user?.id || '', year),
    enabled: !!user?.id && !!year,
  });
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (payload: { name: string; category_name: string; keyword?: string }) =>
      fixedExpenseService.createFixedExpense(user?.id || '', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; category_name: string; keyword?: string } }) =>
      fixedExpenseService.updateFixedExpense(user?.id || '', id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => fixedExpenseService.deleteFixedExpense(user?.id || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides'] });
    },
  });
}

export function useToggleFixedExpenseOverride() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ fixedExpenseId, year, month }: { fixedExpenseId: string; year: number; month: number }) =>
      fixedExpenseService.toggleOverride(user?.id || '', fixedExpenseId, year, month),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expense_overrides', variables.year] });
    },
  });
}
