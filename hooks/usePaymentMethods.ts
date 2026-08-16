import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodService, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '@/services/paymentMethodService';
import { useAuthStore } from '@/store';

export const PAYMENT_METHODS_KEYS = {
  all: (userId?: string) => ['payment_methods', userId] as const,
  detail: (id: string, userId?: string) => ['payment_methods', 'detail', id, userId] as const,
};

export function usePaymentMethods() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: PAYMENT_METHODS_KEYS.all(user?.id),
    queryFn: () => paymentMethodService.getPaymentMethods(),
    enabled: !!user?.id,
  });
}

export function usePaymentMethod(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: PAYMENT_METHODS_KEYS.detail(id, user?.id),
    queryFn: () => paymentMethodService.getPaymentMethodById(id),
    enabled: !!user?.id && !!id,
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePaymentMethodDto) => paymentMethodService.createPaymentMethod(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentMethodDto }) =>
      paymentMethodService.updatePaymentMethod(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentMethodService.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
    },
  });
}
