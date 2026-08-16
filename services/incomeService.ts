import { supabase } from '@/lib/supabase';
import { Income, IncomeSource } from '@/types';

export interface CreateIncomeDto {
  amount: number;
  source: IncomeSource;
  description: string;
  date: string;
}

export interface UpdateIncomeDto extends Partial<CreateIncomeDto> {}

export interface IncomeFilters {
  dateStart?: string;
  dateEnd?: string;
  source?: IncomeSource;
  sortBy?: 'date' | 'amount' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

class IncomeService {
  async getIncome(filters: IncomeFilters = {}): Promise<Income[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData?.user) throw new Error('Not authenticated');

    let query = (supabase as any)
      .from('income')
      .select('*')
      .eq('user_id', userData.user.id);

    if (filters.dateStart) {
      query = query.gte('date', filters.dateStart);
    }
    if (filters.dateEnd) {
      query = query.lte('date', filters.dateEnd);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    const sortColumn = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    
    return (data as Income[]) || [];
  }

  async getIncomeById(id: string): Promise<Income> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await (supabase as any)
      .from('income')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Income;
  }

  async createIncome(dto: CreateIncomeDto): Promise<Income> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await (supabase as any)
      .from('income')
      .insert({
        user_id: userData.user.id,
        ...dto
      })
      .select()
      .single();

    if (error) throw error;
    return data as Income;
  }

  async updateIncome(id: string, dto: UpdateIncomeDto): Promise<Income> {
    const { data, error } = await (supabase as any)
      .from('income')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Income;
  }

  async deleteIncome(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('income')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const incomeService = new IncomeService();
