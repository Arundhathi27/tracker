/**
 * Supabase Database Type Definitions
 * This is a placeholder — replace with generated types from `supabase gen types typescript`
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          updated_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      monthly_budgets: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          month?: string;
          total_amount?: number;
          updated_at?: string;
        };
      };
      budget_categories: {
        Row: {
          id: string;
          user_id: string;
          monthly_budget_id: string;
          name: string;
          icon: string;
          color: string;
          amount: number;
          spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_budget_id: string;
          name: string;
          icon?: string;
          color?: string;
          amount: number;
          spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          amount?: number;
          spent?: number;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          description: string;
          date: string;
          category_id: string | null;
          payment_method_id?: string | null;
          type: 'income' | 'expense';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          description: string;
          date?: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          type: 'income' | 'expense';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          date?: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          type?: 'income' | 'expense';
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_type: 'income' | 'expense';
    };
  };
};
