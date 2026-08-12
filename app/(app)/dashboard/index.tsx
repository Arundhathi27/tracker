import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, Pressable
} from 'react-native';
import { router } from 'expo-router';
import {
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle,
  Plus, LogOut, ArrowRight, Calendar as CalendarIcon, Target, CheckCircle2
} from 'lucide-react-native';
import { useAuthStore } from '@/store';
import { useMonthlyBudgetByMonth, useBudgetCategories } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useIncomeList } from '@/hooks/useIncome';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { BudgetCategory, Transaction } from '@/types';

// ─── Icon map (matches Budget Module icons) ───────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle,
};

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

import { toISOMonth } from '@/utils/date';

// ─── Current month helpers ────────────────────────────────────────────────────
function getCurrentMonthKey(): string {
  return toISOMonth(new Date()); // YYYY-MM
}
function getCurrentMonthLabel(): string {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}
function getMonthDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const lastDay = new Date(y, m + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dateStart: `${y}-${pad(m + 1)}-01`,
    dateEnd: `${y}-${pad(m + 1)}-${lastDay}`,
  };
}

import { ProgressBar } from '@/components/ui/ProgressBar';

function CategoryRow({ cat }: { cat: BudgetCategory }) {
  const IconComp = ICON_MAP[cat.icon] || HelpCircle;
  const color = cat.color || Colors.primary.DEFAULT;
  const allocated = cat.allocated_amount;
  const spent = cat.spent_amount;
  const remaining = allocated - spent;
  const progress = allocated > 0 ? spent / allocated : 0;

  return (
    <View style={styles.categoryRow}>
      <View style={[styles.catIconWrap, { backgroundColor: `${color}20` }]}>
        <IconComp size={20} color={color} />
      </View>
      <View style={styles.catBody}>
        <View style={styles.catTopRow}>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catAllocated}>{formatCurrency(allocated)}</Text>
        </View>
        <ProgressBar progress={progress} color={color} />
        <View style={styles.catBottomRow}>
          <Text style={styles.catSpent}>Spent {formatCurrency(spent)}</Text>
          <Text style={[styles.catRemaining, remaining < 0 && { color: Colors.danger.DEFAULT }]}>
            {remaining >= 0 ? `Remaining ${formatCurrency(remaining)}` : `Over by ${formatCurrency(-remaining)}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RecentExpenseItem({ tx }: { tx: Transaction }) {
  const IconComp = tx.category?.icon ? (ICON_MAP[tx.category.icon] || HelpCircle) : HelpCircle;
  const color = tx.category?.color || Colors.primary.DEFAULT;
  const txDate = new Date(tx.date + 'T00:00:00');
  const formattedDate = txDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.recentItem}>
      <View style={[styles.recentIconWrap, { backgroundColor: `${color}20` }]}>
        <IconComp size={18} color={color} />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentCatName} numberOfLines={1}>{tx.category?.name || 'Uncategorized'}</Text>
        <Text style={styles.recentDate}>{formattedDate}</Text>
      </View>
      <Text style={styles.recentAmount}>-{formatCurrency(tx.amount)}</Text>
    </View>
  );
}

import { Income } from '@/types';
import { getIncomeSourceIcon, getIncomeSourceColor } from '@/components/income/IncomeSourceSelect';

function RecentIncomeItem({ inc }: { inc: Income }) {
  const IconComp = getIncomeSourceIcon(inc.source);
  const color = getIncomeSourceColor(inc.source);
  const incDate = new Date(inc.date + 'T00:00:00');
  const formattedDate = incDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.recentItem}>
      <View style={[styles.recentIconWrap, { backgroundColor: `${color}20` }]}>
        <IconComp size={18} color={color} />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentCatName} numberOfLines={1}>{inc.source}</Text>
        {!!inc.description && inc.description.toLowerCase() !== inc.source.toLowerCase() && inc.description !== 'Income' && (
          <Text style={[styles.recentDate, { marginBottom: 2 }]} numberOfLines={1}>{inc.description}</Text>
        )}
        <Text style={styles.recentDate}>{formattedDate}</Text>
      </View>
      <Text style={[styles.recentAmount, { color: Colors.success.DEFAULT }]}>+{formatCurrency(inc.amount)}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const monthKey = getCurrentMonthKey();
  const { dateStart, dateEnd } = getMonthDateRange();

  // Budget for current month
  const { data: budget, isLoading: loadingBudget, refetch: refetchBudget } = useMonthlyBudgetByMonth(monthKey);

  // Categories for this budget
  const { data: categories, isLoading: loadingCats, refetch: refetchCats } = useBudgetCategories(budget?.id || '');

  // Expenses for this month only, newest first, limit 5 for recent
  const { data: recentExpenses, isLoading: loadingRecent, refetch: refetchRecent } = useTransactions({
    type: 'expense',
    dateStart,
    dateEnd,
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 5,
  });

  // Income for this month
  const { data: incomeList, isLoading: loadingIncome, refetch: refetchIncome } = useIncomeList({
    dateStart,
    dateEnd,
  });
  // Savings Goals
  const { data: goals, isLoading: loadingGoals, refetch: refetchGoals } = useSavingsGoals();

  const isLoading = loadingBudget || loadingCats || loadingRecent || loadingIncome || loadingGoals;

  const handleRefresh = () => {
    refetchBudget();
    refetchCats();
    refetchRecent();
    refetchIncome();
    refetchGoals();
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalBudget = budget?.total_amount || 0;
  const totalSpent = categories?.reduce((sum, c) => sum + c.spent_amount, 0) || 0;
  const totalRemaining = totalBudget - totalSpent;
  const totalIncome = incomeList?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
  const savings = totalIncome - totalSpent;
  
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const overallPct = Math.round(Math.min(overallProgress, 1) * 100);

  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const monthLabel = getCurrentMonthLabel();

  // ── No budget state ───────────────────────────────────────────────────────
  if (!isLoading && !budget) {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
          </View>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <LogOut size={20} color={Colors.text.secondary} />
          </Pressable>
        </View>
        <View style={styles.noBudgetContainer}>
          <Text style={styles.noBudgetTitle}>No Budget Yet</Text>
          <Text style={styles.noBudgetSub}>Create your Monthly Budget to get started.</Text>
          <Pressable
            style={styles.noBudgetBtn}
            onPress={() => router.push('/(app)/budget/create' as any)}
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.noBudgetBtnText}>Create Budget</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <LogOut size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary.DEFAULT} />
        }
      >
        {/* ── Savings Overview ── */}
        <View style={[styles.summaryCard, { paddingVertical: 24, alignItems: 'center' }]}>
          <Text style={styles.summaryCardLabel}>Monthly Savings</Text>
          <Text style={[
            styles.summaryCardAmount, 
            { fontSize: 32, marginTop: 4, color: savings > 0 ? Colors.success.DEFAULT : savings < 0 ? Colors.danger.DEFAULT : Colors.primary.DEFAULT }
          ]}>
            {formatCurrency(savings)}
          </Text>
        </View>

        {/* ── Income & Budget Metrics ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryCardLabel}>Monthly Income</Text>
            <Text style={[styles.summaryCardAmount, { color: Colors.success.DEFAULT }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryCardLabel}>Monthly Budget</Text>
            <Text style={styles.summaryCardAmount}>{formatCurrency(totalBudget)}</Text>
          </View>
        </View>

        {/* ── Spending Metrics ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryCardLabel}>Spent</Text>
            <Text style={[styles.summaryCardAmount, { color: Colors.danger.DEFAULT }]}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryCardLabel}>Remaining Budget</Text>
            <Text style={[styles.summaryCardAmount, { color: totalRemaining >= 0 ? Colors.success.DEFAULT : Colors.danger.DEFAULT }]}>
              {formatCurrency(totalRemaining)}
            </Text>
          </View>
        </View>

        {/* ── Budget Progress ── */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <Text style={[
              styles.pctLabel,
              overallProgress > 0.9 ? { color: Colors.danger.DEFAULT } : {}
            ]}>
              {overallPct}% Used
            </Text>
          </View>
          <ProgressBar progress={overallProgress} />
          <View style={styles.progressMeta}>
            <Text style={styles.progressMetaText}>₹{totalSpent.toLocaleString('en-IN')} spent of ₹{totalBudget.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ── Category Overview ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => router.push(`/(app)/budget/${budget?.id}` as any)}>
              <Text style={styles.seeAll}>Manage</Text>
            </Pressable>
          </View>
          {loadingCats ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ marginVertical: 16 }} />
          ) : categories && categories.length > 0 ? (
            <View style={styles.categoriesList}>
              {categories.map((cat: BudgetCategory) => (
                <CategoryRow key={cat.id} cat={cat} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No categories set for this month.</Text>
              <Pressable
                style={styles.emptyActionBtn}
                onPress={() => router.push(`/(app)/budget/${budget?.id}` as any)}
              >
                <Plus size={14} color={Colors.primary.DEFAULT} />
                <Text style={styles.emptyActionText}>Add Category</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Savings Goals ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <Pressable onPress={() => router.push('/(app)/savings' as any)} style={styles.viewAllRow}>
              <Text style={styles.seeAll}>View All</Text>
              <ArrowRight size={14} color={Colors.primary.DEFAULT} />
            </Pressable>
          </View>

          {loadingGoals ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ marginVertical: 16 }} />
          ) : goals && goals.length > 0 ? (
            <View style={styles.recentList}>
              {goals.slice(0, 3).map((goal: any) => {
                const pct = goal.target_amount > 0 ? Math.min(1, Math.max(0, goal.current_amount / goal.target_amount)) : 0;
                const isCompleted = goal.status === 'completed' || goal.current_amount >= goal.target_amount;
                const remaining = goal.target_amount - goal.current_amount;
                return (
                  <Pressable key={goal.id} onPress={() => router.push(`/(app)/savings/${goal.id}` as any)} style={styles.recentItem}>
                    <View style={[styles.recentIconWrap, { backgroundColor: isCompleted ? `${Colors.success.DEFAULT}20` : `${Colors.primary.DEFAULT}20` }]}>
                      {isCompleted ? <CheckCircle2 size={18} color={Colors.success.DEFAULT} /> : <Target size={18} color={Colors.primary.DEFAULT} />}
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentCatName} numberOfLines={1}>{goal.title}</Text>
                      <View style={{ marginTop: 6, marginBottom: 2 }}>
                        <ProgressBar progress={pct} color={isCompleted ? Colors.success.DEFAULT : Colors.primary.DEFAULT} />
                      </View>
                      <Text style={styles.recentDate}>
                        {isCompleted ? 'Completed' : `${formatCurrency(Math.max(0, remaining))} left`}
                      </Text>
                    </View>
                    <Text style={[styles.recentAmount, { color: Colors.primary.DEFAULT }]}>{Math.round(pct * 100)}%</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No active savings goals.</Text>
            </View>
          )}
        </View>

        {/* ── Recent Expenses ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Pressable onPress={() => router.push('/(app)/transactions' as any)} style={styles.viewAllRow}>
              <Text style={styles.seeAll}>View All</Text>
              <ArrowRight size={14} color={Colors.primary.DEFAULT} />
            </Pressable>
          </View>

          {loadingRecent ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ marginVertical: 16 }} />
          ) : recentExpenses && recentExpenses.length > 0 ? (
            <View style={styles.recentList}>
              {recentExpenses.map((tx: Transaction) => (
                <RecentExpenseItem key={tx.id} tx={tx} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
            </View>
          )}
        </View>

        {/* ── Recent Income ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Income</Text>
            <Pressable onPress={() => router.push('/(app)/income' as any)} style={styles.viewAllRow}>
              <Text style={styles.seeAll}>View All</Text>
              <ArrowRight size={14} color={Colors.primary.DEFAULT} />
            </Pressable>
          </View>

          {loadingIncome ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ marginVertical: 16 }} />
          ) : incomeList && incomeList.length > 0 ? (
            <View style={styles.recentList}>
              {incomeList.slice(0, 5).map((inc: any) => (
                <RecentIncomeItem key={inc.id} inc={inc} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No income recorded yet.</Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionCard, { borderColor: Colors.success.DEFAULT + '40' }]}
              onPress={() => router.push('/(app)/income/create' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.success.DEFAULT}15` }]}>
                <Plus size={22} color={Colors.success.DEFAULT} />
              </View>
              <Text style={styles.actionLabel}>Add Income</Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { borderColor: Colors.danger.DEFAULT + '40' }]}
              onPress={() => router.push('/(app)/transactions/create' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.danger.DEFAULT}15` }]}>
                <Plus size={22} color={Colors.danger.DEFAULT} />
              </View>
              <Text style={styles.actionLabel}>Add Expense</Text>
            </Pressable>
          </View>
          
          <View style={[styles.actionsRow, { marginTop: 12 }]}>
            <Pressable
              style={[styles.actionCard, { borderColor: Colors.primary.DEFAULT + '40' }]}
              onPress={() => router.push(`/(app)/budget/${budget?.id}` as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                <Plus size={22} color={Colors.primary.DEFAULT} />
              </View>
              <Text style={styles.actionLabel}>Add Category</Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { borderColor: Colors.primary.DEFAULT + '40' }]}
              onPress={() => router.push('/(app)/savings/create' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                <Target size={22} color={Colors.primary.DEFAULT} />
              </View>
              <Text style={styles.actionLabel}>Add Goal</Text>
            </Pressable>

            <Pressable
              style={[styles.actionCard, { borderColor: Colors.primary.DEFAULT + '40' }]}
              onPress={() => router.push('/(app)/calendar' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                <CalendarIcon size={22} color={Colors.primary.DEFAULT} />
              </View>
              <Text style={styles.actionLabel}>Calendar View</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  // Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  monthLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 24,
  },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    ...Theme.shadows.md,
  },

  summaryCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  summaryCardAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  summaryCardLabelSm: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryCardAmountSm: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  // Progress section
  section: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    ...Theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pctLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  progressMeta: {
    marginTop: 8,
  },
  progressMetaText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  // Categories
  categoriesList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  catBody: {
    flex: 1,
    gap: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  catAllocated: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  catBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catSpent: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  catRemaining: {
    fontSize: 12,
    color: Colors.success.DEFAULT,
    fontWeight: '500',
  },
  // Recent
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentList: {
    gap: 0,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    gap: 12,
  },
  recentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  recentInfo: {
    flex: 1,
  },
  recentCatName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
  },
  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    gap: 10,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  // Empty states
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  // No budget state
  noBudgetContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  noBudgetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  noBudgetSub: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  noBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Theme.radius.full,
    marginTop: 8,
  },
  noBudgetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
