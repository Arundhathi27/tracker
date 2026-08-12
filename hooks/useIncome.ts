import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  incomeService, 
  CreateIncomeDto, 
  UpdateIncomeDto,
  IncomeFilters
} from '@/services/incomeService';

export const INCOME_KEYS = {
  all: ['income'] as const,
  lists: () => [...INCOME_KEYS.all, 'list'] as const,
  list: (filters: IncomeFilters) => [...INCOME_KEYS.lists(), filters] as const,
  detail: (id: string) => [...INCOME_KEYS.all, 'detail', id] as const,
};

export function useIncomeList(filters: IncomeFilters = {}) {
  return useQuery({
    queryKey: INCOME_KEYS.list(filters),
    queryFn: () => incomeService.getIncome(filters),
  });
}

export function useIncomeDetail(id: string) {
  return useQuery({
    queryKey: INCOME_KEYS.detail(id),
    queryFn: () => incomeService.getIncomeById(id),
    enabled: !!id,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateIncomeDto) => incomeService.createIncome(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_KEYS.all });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIncomeDto }) =>
      incomeService.updateIncome(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INCOME_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INCOME_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => incomeService.deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_KEYS.all });
    },
  });
}
