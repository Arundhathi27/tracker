import { Colors } from '@/constants/colors';

export type BudgetStatusType = 'under' | 'near' | 'exact' | 'over' | 'no_budget';

export interface BudgetStatus {
  status: BudgetStatusType;
  label: string;
  color: string;
  formattedDiff: string;
  remaining: number;
}

/**
 * Calculates budget status based on allocated budget and actual spent amount.
 * 
 * Statuses:
 * 1. UNDER BUDGET: spent < allocated (< 85%) => "₹X remaining"
 * 2. NEAR BUDGET: spent < allocated (>= 85%) => "₹X remaining"
 * 3. EXACTLY AT BUDGET: spent === allocated => "Budget reached"
 * 4. OVER BUDGET: spent > allocated => "₹X over budget"
 * 5. NO BUDGET SET: budget does not exist / allocated is not set => "No budget set"
 */
export function getBudgetStatus(
  allocated: number | null | undefined,
  spent: number,
  hasBudget: boolean = true
): BudgetStatus {
  if (!hasBudget || allocated === null || allocated === undefined || allocated <= 0) {
    return {
      status: 'no_budget',
      label: 'No budget set',
      color: Colors.text.tertiary,
      formattedDiff: 'Not set',
      remaining: 0,
    };
  }

  const remaining = allocated - spent;

  if (spent > allocated) {
    const overAmount = spent - allocated;
    return {
      status: 'over',
      label: `₹${overAmount.toLocaleString('en-IN')} over budget`,
      color: Colors.danger.DEFAULT,
      formattedDiff: `₹${overAmount.toLocaleString('en-IN')}`,
      remaining,
    };
  }

  if (spent === allocated && allocated > 0) {
    return {
      status: 'exact',
      label: 'Budget reached',
      color: Colors.warning.DEFAULT,
      formattedDiff: '₹0',
      remaining: 0,
    };
  }

  const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
  if (pct >= 85) {
    return {
      status: 'near',
      label: `₹${remaining.toLocaleString('en-IN')} remaining`,
      color: Colors.warning.DEFAULT,
      formattedDiff: `₹${remaining.toLocaleString('en-IN')}`,
      remaining,
    };
  }

  return {
    status: 'under',
    label: `₹${remaining.toLocaleString('en-IN')} remaining`,
    color: Colors.success.DEFAULT,
    formattedDiff: `₹${remaining.toLocaleString('en-IN')}`,
    remaining,
  };
}
