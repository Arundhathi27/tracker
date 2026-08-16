import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  incomeService, 
  CreateIncomeDto, 
  UpdateIncomeDto,
  IncomeFilters
} from '@/services/incomeService';
import { useAuthStore } from '@/store';

export const INCOME_KEYS = {
  all: (userId?: string) => ['income', userId] as const,
  lists: (userId?: string) => ['income', 'list', userId] as const,
  list: (filters: IncomeFilters, userId?: string) => ['income', 'list', filters, userId] as const,
  detail: (id: string, userId?: string) => ['income', 'detail', id, userId] as const,
};

export function useIncomeList(filters: IncomeFilters = {}) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: INCOME_KEYS.list(filters, user?.id),
    queryFn: () => incomeService.getIncome(filters),
    enabled: !!user?.id,
  });
}

export function useIncomeDetail(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: INCOME_KEYS.detail(id, user?.id),
    queryFn: () => incomeService.getIncomeById(id),
    enabled: !!user?.id && !!id,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateIncomeDto) => incomeService.createIncome(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIncomeDto }) =>
      incomeService.updateIncome(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => incomeService.deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
  });
}
