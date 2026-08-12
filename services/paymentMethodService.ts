import { BaseService } from './base';
import { PaymentMethod } from '@/types';

export type CreatePaymentMethodDto = {
  name: string;
};

export type UpdatePaymentMethodDto = Partial<CreatePaymentMethodDto>;

class PaymentMethodService extends BaseService {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PaymentMethod[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod> {
    try {
      const { data, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PaymentMethod;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPaymentMethod(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('payment_methods')
        .insert({
          ...dto,
          user_id: userData.user.id,
        } as any)
        .select('*')
        .single();

      if (error) throw error;
      return data as PaymentMethod;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePaymentMethod(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    try {
      const { data, error } = await (this.supabase.from('payment_methods') as any)
        .update(dto)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data as PaymentMethod;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deletePaymentMethod(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const paymentMethodService = new PaymentMethodService();
