import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  budgetService, 
  CreateMonthlyBudgetDto, 
  UpdateMonthlyBudgetDto,
  CreateBudgetCategoryDto,
  UpdateBudgetCategoryDto
} from '@/services/budgetService';
import { useAuthStore } from '@/store';

export const BUDGET_KEYS = {
  monthlyBudgets: (userId?: string) => ['monthly_budgets', userId] as const,
  monthlyBudgetDetail: (id: string, userId?: string) => ['monthly_budgets', 'detail', id, userId] as const,
  monthlyBudgetByMonth: (month: string, userId?: string) => ['monthly_budgets', 'month', month, userId] as const,
  budgetCategories: (monthlyBudgetId: string, userId?: string) => ['budget_categories', monthlyBudgetId, userId] as const,
};

// ─── Monthly Budgets ────────────────────────────────────────────────────────

export function useMonthlyBudgets() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgets(user?.id),
    queryFn: () => budgetService.getMonthlyBudgets(),
    enabled: !!user?.id,
  });
}

export function useMonthlyBudget(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgetDetail(id, user?.id),
    queryFn: () => budgetService.getMonthlyBudgetById(id),
    enabled: !!user?.id && !!id,
  });
}

export function useMonthlyBudgetByMonth(month: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgetByMonth(month, user?.id),
    queryFn: () => budgetService.getMonthlyBudgetByMonth(month),
    enabled: !!user?.id && !!month,
  });
}

export function useCreateMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMonthlyBudgetDto) => budgetService.createMonthlyBudget(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}

export function useUpdateMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMonthlyBudgetDto }) =>
      budgetService.updateMonthlyBudget(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}

export function useDeleteMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetService.deleteMonthlyBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}

// ─── Budget Categories ──────────────────────────────────────────────────────

export function useBudgetCategories(monthlyBudgetId: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: BUDGET_KEYS.budgetCategories(monthlyBudgetId, user?.id),
    queryFn: () => budgetService.getBudgetCategories(monthlyBudgetId),
    enabled: !!user?.id && !!monthlyBudgetId,
  });
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBudgetCategoryDto) => budgetService.createBudgetCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}

export function useUpdateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetCategoryDto; monthlyBudgetId: string }) =>
      budgetService.updateBudgetCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}

export function useDeleteBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; monthlyBudgetId: string }) => budgetService.deleteBudgetCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_categories'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_budgets'] });
    },
  });
}
