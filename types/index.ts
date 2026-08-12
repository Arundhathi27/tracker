/**
 * Global TypeScript Types & Interfaces for BudgetWise
 */

// ─── Utility Types ────────────────────────────────────────────────────────

/** Makes specified keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Makes specified keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Deeply partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** API Response wrapper */
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

/** Paginated response */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// ─── Domain Types ─────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type Currency = string;

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string; // e.g. 'UPI', 'Cash', 'Credit Card'
  created_at: string;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  month: string; // '2026-07'
  total_amount: number;
  created_at: string;
  updated_at: string;
  // Computed (from joining categories)
  budget_categories?: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  user_id: string;
  monthly_budget_id: string;
  name: string; // 'Groceries', 'Rent', etc.
  icon: string;
  color: string;
  amount: number; // Underlying DB limit
  spent: number;  // Underlying DB spent
  allocated_amount: number; // Mapped UI field
  spent_amount: number;     // Mapped UI field
  created_at: string;
  updated_at: string;
  // Relations
  monthly_budget?: MonthlyBudget;
  // Computed
  remaining_amount?: number;
  percentage?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  category_id?: string | null; // Nullable for income
  payment_method_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: BudgetCategory;
  payment_method?: PaymentMethod;
}

export type IncomeSource = 
  | 'Salary' 
  | 'Freelance' 
  | 'Business' 
  | 'Investment' 
  | 'Gift' 
  | 'Refund' 
  | 'Bonus' 
  | 'Other';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: IncomeSource;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// ─── UI Types ────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outline';

// ─── Navigation Types ─────────────────────────────────────────────────────

export type RootTabParamList = {
  'index': undefined;
  'dashboard': undefined;
  'budgets': undefined;
  'expenses': undefined;
  'reports': undefined;
  'profile': undefined;
};

// ─── Form Types ───────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  category_id?: string;
  payment_method_id: string;
}

export interface MonthlyBudgetFormData {
  month: string;
  total_amount: string;
}

export interface BudgetCategoryFormData {
  name: string;
  icon: string;
  color: string;
  allocated_amount: string;
}
