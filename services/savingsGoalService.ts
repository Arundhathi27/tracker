import { supabase } from '@/lib/supabase';
import { SavingsGoal } from '@/types';

export const savingsGoalService = {
  async getGoals(): Promise<SavingsGoal[]> {
    const { data, error } = await (supabase.from('savings_goals') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  async getGoal(id: string): Promise<SavingsGoal | null> {
    const { data, error } = await (supabase.from('savings_goals') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  },

  async createGoal(dto: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await (supabase.from('savings_goals') as any)
      .insert({
        user_id: userData.user.id,
        ...dto
      })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  async updateGoal(id: string, dto: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const { data, error } = await (supabase.from('savings_goals') as any)
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await (supabase.from('savings_goals') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
  
  async updateGoalProgress(id: string, current_amount: number): Promise<SavingsGoal> {
    const { data, error } = await (supabase.from('savings_goals') as any)
      .update({ current_amount })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },
  
  async markGoalCompleted(id: string): Promise<SavingsGoal> {
    const { data, error } = await (supabase.from('savings_goals') as any)
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }
};
