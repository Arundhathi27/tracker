import { BaseService } from './base';

export interface CategoryMapping {
  id: string;
  user_id: string;
  keyword: string;
  category_name: string;
  created_at: string;
  updated_at: string;
}

class CategoryMappingService extends BaseService {
  /**
   * Fetches user's custom description -> category mappings
   * Returns a dictionary of lowercased keyword -> category_name
   */
  async getUserMappings(): Promise<Record<string, string>> {
    try {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData?.user) return {};

      const { data, error } = await this.supabase
        .from('expense_category_mappings')
        .select('*')
        .eq('user_id', userData.user.id);

      if (error) return {};

      const map: Record<string, string> = {};
      (data as CategoryMapping[]).forEach(item => {
        if (item.keyword && item.category_name) {
          map[item.keyword.toLowerCase().trim()] = item.category_name.trim();
        }
      });
      return map;
    } catch {
      return {};
    }
  }

  /**
   * Saves or updates a user-specific keyword -> category mapping
   */
  async saveUserMapping(keyword: string, categoryName: string): Promise<void> {
    try {
      if (!keyword || !keyword.trim() || !categoryName || !categoryName.trim()) return;
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData?.user) return;

      const normalizedKw = keyword.toLowerCase().trim();
      const normalizedCat = categoryName.trim();

      const { error } = await (this.supabase.from('expense_category_mappings') as any)
        .upsert(
          {
            user_id: userData.user.id,
            keyword: normalizedKw,
            category_name: normalizedCat,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,keyword' }
        );

      if (error) {
        console.warn('Could not save user category mapping:', error.message);
      }
    } catch (err) {
      // Non-blocking fallback
    }
  }
}

export const categoryMappingService = new CategoryMappingService();
