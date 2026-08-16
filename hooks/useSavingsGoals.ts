import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsGoalService } from '@/services/savingsGoalService';
import { SavingsGoal } from '@/types';
import { useAuthStore } from '@/store';

export const SAVINGS_GOAL_KEYS = {
  all: (userId?: string) => ['savings_goals', userId] as const,
  lists: (userId?: string) => ['savings_goals', 'list', userId] as const,
  detail: (id: string, userId?: string) => ['savings_goals', 'detail', id, userId] as const,
};

export function useSavingsGoals() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: SAVINGS_GOAL_KEYS.lists(user?.id),
    queryFn: () => savingsGoalService.getGoals(),
    enabled: !!user?.id,
  });
}

export function useSavingsGoal(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: SAVINGS_GOAL_KEYS.detail(id, user?.id),
    queryFn: () => savingsGoalService.getGoal(id),
    enabled: !!user?.id && !!id,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SavingsGoal>) => savingsGoalService.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SavingsGoal> & { id: string }) => 
      savingsGoalService.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => savingsGoalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, current_amount }: { id: string, current_amount: number }) => 
      savingsGoalService.updateGoalProgress(id, current_amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
}
