import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  budgetService, 
  CreateMonthlyBudgetDto, 
  UpdateMonthlyBudgetDto,
  CreateBudgetCategoryDto,
  UpdateBudgetCategoryDto
} from '@/services/budgetService';

export const BUDGET_KEYS = {
  monthlyBudgets: ['monthly_budgets'] as const,
  monthlyBudgetDetail: (id: string) => [...BUDGET_KEYS.monthlyBudgets, id] as const,
  monthlyBudgetByMonth: (month: string) => [...BUDGET_KEYS.monthlyBudgets, 'month', month] as const,
  budgetCategories: (monthlyBudgetId: string) => ['budget_categories', monthlyBudgetId] as const,
};

// ─── Monthly Budgets ────────────────────────────────────────────────────────

export function useMonthlyBudgets() {
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgets,
    queryFn: () => budgetService.getMonthlyBudgets(),
  });
}

export function useMonthlyBudget(id: string) {
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgetDetail(id),
    queryFn: () => budgetService.getMonthlyBudgetById(id),
    enabled: !!id,
  });
}

export function useMonthlyBudgetByMonth(month: string) {
  return useQuery({
    queryKey: BUDGET_KEYS.monthlyBudgetByMonth(month),
    queryFn: () => budgetService.getMonthlyBudgetByMonth(month),
    enabled: !!month,
  });
}

export function useCreateMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMonthlyBudgetDto) => budgetService.createMonthlyBudget(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgetByMonth(variables.month) });
    },
  });
}

export function useUpdateMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMonthlyBudgetDto }) =>
      budgetService.updateMonthlyBudget(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgetDetail(variables.id) });
    },
  });
}

export function useDeleteMonthlyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetService.deleteMonthlyBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
    },
  });
}

// ─── Budget Categories ──────────────────────────────────────────────────────

export function useBudgetCategories(monthlyBudgetId: string) {
  return useQuery({
    queryKey: BUDGET_KEYS.budgetCategories(monthlyBudgetId),
    queryFn: () => budgetService.getBudgetCategories(monthlyBudgetId),
    enabled: !!monthlyBudgetId,
  });
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBudgetCategoryDto) => budgetService.createBudgetCategory(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.budgetCategories(variables.monthly_budget_id) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
    },
  });
}

export function useUpdateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto, monthlyBudgetId }: { id: string; dto: UpdateBudgetCategoryDto, monthlyBudgetId: string }) =>
      budgetService.updateBudgetCategory(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.budgetCategories(variables.monthlyBudgetId) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
    },
  });
}

export function useDeleteBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, monthlyBudgetId }: { id: string, monthlyBudgetId: string }) => budgetService.deleteBudgetCategory(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.budgetCategories(variables.monthlyBudgetId) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.monthlyBudgets });
    },
  });
}
