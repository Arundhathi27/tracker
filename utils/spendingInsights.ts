export interface SpendingInsight {
  id: string;
  icon: string;
  type: 'warning' | 'success' | 'info';
  text: string;
}

/**
 * Generates max 3 meaningful spending insights based on current month transactions, budgets,
 * and previous month spending comparison.
 */
export function generateSpendingInsights(
  totalBudget: number,
  categories: { name: string; allocated_amount: number; spent_amount: number }[] = [],
  totalSpent: number,
  hasTransactions: boolean,
  prevMonthSpent?: number,
  hasPrevMonthData?: boolean
): SpendingInsight[] {
  if (!hasTransactions) {
    return [];
  }

  const insights: SpendingInsight[] = [];

  // 1. Previous month comparison insight (if previous month data exists)
  if (hasPrevMonthData && prevMonthSpent !== undefined) {
    const diff = totalSpent - prevMonthSpent;
    const absDiff = Math.abs(diff);

    if (diff > 0) {
      insights.push({
        id: 'prev-month-diff',
        icon: '📈',
        type: 'warning',
        text: `You spent ₹${absDiff.toLocaleString('en-IN')} more than last month.`,
      });
    } else if (diff < 0) {
      insights.push({
        id: 'prev-month-diff',
        icon: '📉',
        type: 'success',
        text: `You spent ₹${absDiff.toLocaleString('en-IN')} less than last month.`,
      });
    }
  }

  // 2. Over-budget category check (highest overage first)
  const overCategories = categories
    .filter(c => c.spent_amount > c.allocated_amount && c.allocated_amount > 0)
    .map(c => ({
      name: c.name,
      overAmount: c.spent_amount - c.allocated_amount,
    }))
    .sort((a, b) => b.overAmount - a.overAmount);

  if (overCategories.length > 0) {
    const topOver = overCategories[0];
    insights.push({
      id: `over-cat-${topOver.name}`,
      icon: '⚠️',
      type: 'warning',
      text: `${topOver.name} spending is ₹${topOver.overAmount.toLocaleString('en-IN')} over your planned budget.`,
    });
  }

  // 3. Under/Over overall monthly budget check
  if (totalBudget > 0) {
    if (totalSpent < totalBudget && insights.length < 3) {
      const savedAmount = totalBudget - totalSpent;
      insights.push({
        id: 'under-total-budget',
        icon: '💰',
        type: 'success',
        text: `You spent ₹${savedAmount.toLocaleString('en-IN')} less than your total budget this month.`,
      });
    } else if (totalSpent > totalBudget && overCategories.length === 0 && insights.length < 3) {
      const overTotal = totalSpent - totalBudget;
      insights.push({
        id: 'over-total-budget',
        icon: '⚠️',
        type: 'warning',
        text: `Total spending is ₹${overTotal.toLocaleString('en-IN')} over your monthly budget.`,
      });
    }
  }

  // 4. Highest spending category check
  const activeCategories = categories
    .filter(c => c.spent_amount > 0)
    .sort((a, b) => b.spent_amount - a.spent_amount);

  if (activeCategories.length > 0 && insights.length < 3) {
    const topSpentCat = activeCategories[0];
    insights.push({
      id: `highest-cat-${topSpentCat.name}`,
      icon: '📊',
      type: 'info',
      text: `${topSpentCat.name} is your highest spending category this month.`,
    });
  }

  // Cap at maximum 3 insights
  return insights.slice(0, 3);
}
