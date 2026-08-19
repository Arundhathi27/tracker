import { BaseService } from './base';
import { Transaction, TransactionType } from '@/types';

export type CreateTransactionDto = {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  category_id?: string | null;
  payment_method_id?: string | null;
};

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export type TransactionFilters = {
  dateStart?: string;
  dateEnd?: string;
  categoryId?: string;
  paymentMethodId?: string;
  type?: TransactionType;
  query?: string;
  limit?: number;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

class TransactionService extends BaseService {
  async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      let query = this.supabase
        .from('transactions')
        .select('*, category:budget_categories(*), payment_method:payment_methods(*)')
        .eq('user_id', userData.user.id);

      if (filters.dateStart) {
        query = query.gte('date', filters.dateStart);
      }
      if (filters.dateEnd) {
        query = query.lte('date', filters.dateEnd);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.paymentMethodId) {
        query = query.eq('payment_method_id', filters.paymentMethodId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.query) {
        query = query.ilike('description', `%${filters.query}%`);
      }

      if (filters.sortBy === 'amount') {
        query = query.order('amount', { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('date', { ascending: filters.sortOrder === 'asc' })
                     .order('created_at', { ascending: false });
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('transactions')
        .select('*, category:budget_categories(*), payment_method:payment_methods(*)')
        .eq('user_id', userData.user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await (this.supabase.from('transactions') as any)
        .insert({
          ...dto,
          user_id: userData.user.id,
        })
        .select('*, category:budget_categories(*), payment_method:payment_methods(*)')
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTransactionsBatch(dtos: CreateTransactionDto[]): Promise<Transaction[]> {
    try {
      if (!dtos || dtos.length === 0) return [];
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const rowsToInsert = dtos.map(dto => ({
        ...dto,
        user_id: userData.user.id,
      }));

      const { data, error } = await (this.supabase.from('transactions') as any)
        .insert(rowsToInsert)
        .select('*, category:budget_categories(*), payment_method:payment_methods(*)');

      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    try {
      const { data, error } = await (this.supabase.from('transactions') as any)
        .update(dto)
        .eq('id', id)
        .select('*, category:budget_categories(*), payment_method:payment_methods(*)')
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteTransactionsBatch(ids: string[]): Promise<number> {
    try {
      if (!ids || ids.length === 0) return 0;
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const CHUNK_SIZE = 50;
      let deletedTotal = 0;

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { error, count } = await this.supabase
          .from('transactions')
          .delete({ count: 'exact' })
          .eq('user_id', userData.user.id) // User scoping!
          .in('id', chunk);

        if (error) throw error;
        if (count !== null && count !== undefined) {
          deletedTotal += count;
        } else {
          deletedTotal += chunk.length;
        }
      }

      return deletedTotal;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const transactionService = new TransactionService();
