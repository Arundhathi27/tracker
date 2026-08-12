import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsGoalService } from '@/services/savingsGoalService';
import { SavingsGoal } from '@/types';

export const SAVINGS_GOAL_KEYS = {
  all: ['savings_goals'] as const,
  lists: () => [...SAVINGS_GOAL_KEYS.all, 'list'] as const,
  detail: (id: string) => [...SAVINGS_GOAL_KEYS.all, 'detail', id] as const,
};

export function useSavingsGoals() {
  return useQuery({
    queryKey: SAVINGS_GOAL_KEYS.lists(),
    queryFn: () => savingsGoalService.getGoals(),
  });
}

export function useSavingsGoal(id: string) {
  return useQuery({
    queryKey: SAVINGS_GOAL_KEYS.detail(id),
    queryFn: () => savingsGoalService.getGoal(id),
    enabled: !!id,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SavingsGoal>) => savingsGoalService.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.lists() });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SavingsGoal> & { id: string }) => 
      savingsGoalService.updateGoal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => savingsGoalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.lists() });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, current_amount }: { id: string, current_amount: number }) => 
      savingsGoalService.updateGoalProgress(id, current_amount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOAL_KEYS.detail(variables.id) });
    },
  });
}
