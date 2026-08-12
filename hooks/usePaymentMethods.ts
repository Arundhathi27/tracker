import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodService, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '@/services/paymentMethodService';

export const PAYMENT_METHODS_KEYS = {
  all: ['payment_methods'] as const,
  detail: (id: string) => [...PAYMENT_METHODS_KEYS.all, id] as const,
};

export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_METHODS_KEYS.all,
    queryFn: () => paymentMethodService.getPaymentMethods(),
  });
}

export function usePaymentMethod(id: string) {
  return useQuery({
    queryKey: PAYMENT_METHODS_KEYS.detail(id),
    queryFn: () => paymentMethodService.getPaymentMethodById(id),
    enabled: !!id,
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePaymentMethodDto) => paymentMethodService.createPaymentMethod(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentMethodDto }) =>
      paymentMethodService.updatePaymentMethod(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.detail(variables.id) });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentMethodService.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEYS.all });
    },
  });
}
