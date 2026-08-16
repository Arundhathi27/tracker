import { BaseService } from './base';
import { MonthlyBudget, BudgetCategory } from '@/types';

export type CreateMonthlyBudgetDto = {
  month: string;
  total_amount: number;
};

export type UpdateMonthlyBudgetDto = Partial<CreateMonthlyBudgetDto>;

export type CreateBudgetCategoryDto = {
  monthly_budget_id: string;
  name: string;
  icon: string;
  color: string;
  allocated_amount: number;
};

export type UpdateBudgetCategoryDto = Partial<Omit<CreateBudgetCategoryDto, 'monthly_budget_id'>>;

class BudgetService extends BaseService {
  // ─── Monthly Budgets ────────────────────────────────────────────────────────

  async getMonthlyBudgets(): Promise<MonthlyBudget[]> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('monthly_budgets')
        .select('*, budget_categories(*)')
        .eq('user_id', userData.user.id)
        .order('month', { ascending: false });

      if (error) throw error;
      return data as MonthlyBudget[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMonthlyBudgetById(id: string): Promise<MonthlyBudget> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('monthly_budgets')
        .select('*, budget_categories(*)')
        .eq('user_id', userData.user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MonthlyBudget;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMonthlyBudgetByMonth(month: string): Promise<MonthlyBudget | null> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('monthly_budgets')
        .select('*, budget_categories(*)')
        .eq('user_id', userData.user.id)
        .eq('month', month)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyBudget | null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async createMonthlyBudget(dto: CreateMonthlyBudgetDto): Promise<MonthlyBudget> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('monthly_budgets')
        .insert({
          ...dto,
          user_id: userData.user.id,
        } as any)
        .select('*, budget_categories(*)')
        .single();

      if (error) throw error;
      return data as MonthlyBudget;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMonthlyBudget(id: string, dto: UpdateMonthlyBudgetDto): Promise<MonthlyBudget> {
    try {
      const { data, error } = await (this.supabase.from('monthly_budgets') as any)
        .update(dto)
        .eq('id', id)
        .select('*, budget_categories(*)')
        .single();

      if (error) throw error;
      return data as MonthlyBudget;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMonthlyBudget(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ─── Budget Categories ──────────────────────────────────────────────────────

  async getBudgetCategories(monthlyBudgetId: string): Promise<BudgetCategory[]> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('monthly_budget_id', monthlyBudgetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as BudgetCategory[]).map(cat => ({
        ...cat,
        allocated_amount: cat.amount,
        spent_amount: cat.spent,
        remaining_amount: cat.amount - cat.spent
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBudgetCategoryById(id: string): Promise<BudgetCategory> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      const cat = data as BudgetCategory;
      return {
        ...cat,
        allocated_amount: cat.amount,
        spent_amount: cat.spent,
        remaining_amount: cat.amount - cat.spent
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async createBudgetCategory(dto: CreateBudgetCategoryDto): Promise<BudgetCategory> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await this.supabase
        .from('budget_categories')
        .insert({
          monthly_budget_id: dto.monthly_budget_id,
          name: dto.name,
          icon: dto.icon,
          color: dto.color,
          amount: dto.allocated_amount,
          user_id: userData.user.id,
          spent: 0,
        } as any)
        .select('*')
        .single();

      if (error) throw error;
      const cat = data as BudgetCategory;
      return {
        ...cat,
        allocated_amount: cat.amount,
        spent_amount: cat.spent,
        remaining_amount: cat.amount - cat.spent
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateBudgetCategory(id: string, dto: UpdateBudgetCategoryDto): Promise<BudgetCategory> {
    try {
      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.icon !== undefined) updateData.icon = dto.icon;
      if (dto.color !== undefined) updateData.color = dto.color;
      if (dto.allocated_amount !== undefined) updateData.amount = dto.allocated_amount;

      const { data, error } = await (this.supabase.from('budget_categories') as any)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      const cat = data as BudgetCategory;
      return {
        ...cat,
        allocated_amount: cat.amount,
        spent_amount: cat.spent,
        remaining_amount: cat.amount - cat.spent
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteBudgetCategory(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('budget_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const budgetService = new BudgetService();
