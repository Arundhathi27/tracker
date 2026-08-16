import { supabase } from '@/lib/supabase';
import type { FixedExpense, FixedExpenseOverride } from '@/types';

export const fixedExpenseService = {
  /**
   * Fetch all fixed expense templates for the authenticated user
   */
  async getFixedExpenses(userId: string): Promise<FixedExpense[]> {
    if (!userId) return [];
    
    const { data, error } = await (supabase as any)
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[FixedExpenseService] Error fetching fixed expenses:', error.message);
      throw new Error(error.message);
    }

    return (data || []) as FixedExpense[];
  },

  /**
   * Create a new fixed expense template
   */
  async createFixedExpense(
    userId: string,
    payload: { name: string; category_name: string; keyword?: string }
  ): Promise<FixedExpense> {
    if (!userId) throw new Error('User authentication required');

    const { data, error } = await (supabase as any)
      .from('fixed_expenses')
      .insert({
        user_id: userId,
        name: payload.name.trim(),
        category_name: payload.category_name.trim(),
        keyword: (payload.keyword || '').trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('[FixedExpenseService] Error creating fixed expense:', error.message);
      throw new Error(error.message);
    }

    return data as FixedExpense;
  },

  /**
   * Update an existing fixed expense template
   */
  async updateFixedExpense(
    userId: string,
    id: string,
    payload: { name: string; category_name: string; keyword?: string }
  ): Promise<FixedExpense> {
    if (!userId) throw new Error('User authentication required');

    const { data, error } = await (supabase as any)
      .from('fixed_expenses')
      .update({
        name: payload.name.trim(),
        category_name: payload.category_name.trim(),
        keyword: (payload.keyword || '').trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('[FixedExpenseService] Error updating fixed expense:', error.message);
      throw new Error(error.message);
    }

    return data as FixedExpense;
  },

  /**
   * Delete a fixed expense template
   */
  async deleteFixedExpense(userId: string, id: string): Promise<void> {
    if (!userId) throw new Error('User authentication required');

    const { error } = await (supabase as any)
      .from('fixed_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[FixedExpenseService] Error deleting fixed expense:', error.message);
      throw new Error(error.message);
    }
  },

  /**
   * Fetch all manual overrides for a given year and user
   */
  async getOverrides(userId: string, year: number): Promise<FixedExpenseOverride[]> {
    if (!userId) return [];

    const { data, error } = await (supabase as any)
      .from('fixed_expense_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);

    if (error) {
      console.error('[FixedExpenseService] Error fetching overrides:', error.message);
      // If table does not exist yet or fails, return empty list gracefully
      return [];
    }

    return (data || []) as FixedExpenseOverride[];
  },

  /**
   * Toggle manual override for a specific month when no matching transaction exists
   */
  async toggleOverride(
    userId: string,
    fixedExpenseId: string,
    year: number,
    month: number
  ): Promise<void> {
    if (!userId) throw new Error('User authentication required');

    // 1. Check if override already exists
    const { data: existing } = await (supabase as any)
      .from('fixed_expense_overrides')
      .select('id')
      .eq('user_id', userId)
      .eq('fixed_expense_id', fixedExpenseId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      // Delete existing override (toggle off)
      const { error: deleteError } = await (supabase as any)
        .from('fixed_expense_overrides')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('[FixedExpenseService] Error removing override:', deleteError.message);
        throw new Error(deleteError.message);
      }
    } else {
      // Insert new override (toggle on)
      const { error: insertError } = await (supabase as any)
        .from('fixed_expense_overrides')
        .insert({
          user_id: userId,
          fixed_expense_id: fixedExpenseId,
          year,
          month,
        });

      if (insertError) {
        console.error('[FixedExpenseService] Error adding override:', insertError.message);
        throw new Error(insertError.message);
      }
    }
  },
};
