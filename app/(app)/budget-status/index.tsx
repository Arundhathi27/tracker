import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, ChevronRight, PieChart,
  ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone,
  Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle
} from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { useMonthlyBudgetByMonth, useBudgetCategories } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { getBudgetStatus } from '@/utils/budgetStatus';
import { toISOMonth } from '@/utils/date';
import { BudgetCategory } from '@/types';

// ─── Icon Map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone,
  Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle,
};

// ─── Month Helpers ─────────────────────────────────────────────────────────────
function generateMonthList() {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({
      key: toISOMonth(d),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return list;
}

function getDateRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    dateStart: `${year}-${pad(month + 1)}-01`,
    dateEnd: `${year}-${pad(month + 1)}-${lastDay}`,
  };
}

// ─── Progress Bar Component ────────────────────────────────────────────────────
function ProgressBar({ progress, color = Colors.primary.DEFAULT }: { progress: number; color?: string }) {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={pbStyles.bg}>
      <View style={[pbStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}
const pbStyles = StyleSheet.create({
  bg: { height: 8, backgroundColor: Colors.border.DEFAULT, borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  fill: { height: '100%', borderRadius: 4 },
});

export default function CategoryBudgetReportScreen() {
  const [monthIdx, setMonthIdx] = useState(0);

  const monthsList = useMemo(() => generateMonthList(), []);
  const { key: monthKey, label: monthLabel, year, month } = monthsList[monthIdx];
  const { dateStart, dateEnd } = getDateRange(year, month);

  // Data hooks for selected month
  const { data: budget, isLoading: loadingBudget, refetch: refetchBudget } = useMonthlyBudgetByMonth(monthKey);
  const { data: categories, isLoading: loadingCats, refetch: refetchCats } = useBudgetCategories(budget?.id || '');
  const { data: expenses, isLoading: loadingExpenses, refetch: refetchExpenses } = useTransactions({
    type: 'expense',
    dateStart,
    dateEnd,
  });

  const handleRefresh = useCallback(() => {
    refetchBudget();
    refetchCats();
    refetchExpenses();
  }, [refetchBudget, refetchCats, refetchExpenses]);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  const isLoading = loadingBudget || loadingCats || loadingExpenses;

  // ── Unified Report Items (Combines budgeted categories + unbudgeted expenses) ──
  const reportItems = useMemo(() => {
    const items: {
      id: string;
      name: string;
      icon: string;
      color: string;
      allocatedAmount: number;
      spentAmount: number;
      hasBudget: boolean;
    }[] = [];

    const budgetedCatNames = new Set<string>();

    // 1. Map budgeted categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const lowerName = cat.name.trim().toLowerCase();
        budgetedCatNames.add(lowerName);

        // Sum actual transactions for this month for this category
        let actualSpent = cat.spent_amount || 0;
        if (expenses && expenses.length > 0) {
          const txSum = expenses
            .filter(tx => {
              const txCat = tx.category?.name || tx.description;
              return txCat && txCat.trim().toLowerCase() === lowerName;
            })
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          actualSpent = Math.max(actualSpent, txSum);
        }

        items.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'HelpCircle',
          color: cat.color || Colors.primary.DEFAULT,
          allocatedAmount: cat.allocated_amount,
          spentAmount: actualSpent,
          hasBudget: true,
        });
      });
    }

    // 2. Include unbudgeted expenses for this month
    if (expenses && expenses.length > 0) {
      const unbudgetedGroup: Record<string, { spent: number; icon: string; color: string }> = {};

      expenses.forEach(tx => {
        const catName = (tx.category?.name || tx.description || 'General').trim();
        const lowerName = catName.toLowerCase();

        if (!budgetedCatNames.has(lowerName)) {
          if (!unbudgetedGroup[catName]) {
            unbudgetedGroup[catName] = {
              spent: 0,
              icon: tx.category?.icon || 'HelpCircle',
              color: tx.category?.color || Colors.primary.DEFAULT,
            };
          }
          unbudgetedGroup[catName].spent += Number(tx.amount || 0);
        }
      });

      Object.keys(unbudgetedGroup).forEach((catName, idx) => {
        items.push({
          id: `unbudgeted-${idx}-${catName}`,
          name: catName,
          icon: unbudgetedGroup[catName].icon,
          color: unbudgetedGroup[catName].color,
          allocatedAmount: 0,
          spentAmount: unbudgetedGroup[catName].spent,
          hasBudget: false,
        });
      });
    }

    return items;
  }, [categories, expenses]);

  // ── Summary Status Breakdown ──
  const summary = useMemo(() => {
    let underCount = 0;
    let exactCount = 0;
    let overCount = 0;
    let noBudgetCount = 0;

    reportItems.forEach(item => {
      const status = getBudgetStatus(item.allocatedAmount, item.spentAmount, item.hasBudget);
      if (status.status === 'under' || status.status === 'near') underCount++;
      else if (status.status === 'exact') exactCount++;
      else if (status.status === 'over') overCount++;
      else if (status.status === 'no_budget') noBudgetCount++;
    });

    return { underCount, exactCount, overCount, noBudgetCount };
  }, [reportItems]);

  return (
    <View style={styles.container}>
      <Header
        title="Category Budget Report"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Month Selector ── */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => setMonthIdx(i => Math.min(i + 1, monthsList.length - 1))}
            disabled={monthIdx === monthsList.length - 1}
            style={styles.monthArrow}
          >
            <ChevronLeft size={22} color={monthIdx === monthsList.length - 1 ? Colors.text.tertiary : Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setMonthIdx(i => Math.max(i - 1, 0))}
            disabled={monthIdx === 0}
            style={styles.monthArrow}
          >
            <ChevronRight size={22} color={monthIdx === 0 ? Colors.text.tertiary : Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          </View>
        ) : reportItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <PieChart size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No expenses or budgets for {monthLabel}</Text>
            <Text style={styles.emptySubtitle}>No records found for this month.</Text>
            <Button
              label="Set Up Budget"
              onPress={() => router.push('/(app)/budget' as any)}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <>
            {/* ── Status Summary Header Banner ── */}
            <View style={styles.summaryRow}>
              {summary.noBudgetCount > 0 && summary.underCount === 0 && summary.overCount === 0 ? (
                <View style={[styles.summaryCard, { flex: 1, borderColor: Colors.border.DEFAULT }]}>
                  <Text style={[styles.summaryCount, { color: Colors.text.primary }]}>{summary.noBudgetCount}</Text>
                  <Text style={styles.summaryLabel}>No Budget Set</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.summaryCard, { borderColor: `${Colors.success.DEFAULT}40` }]}>
                    <Text style={[styles.summaryCount, { color: Colors.success.DEFAULT }]}>{summary.underCount}</Text>
                    <Text style={styles.summaryLabel}>Under Budget</Text>
                  </View>
                  <View style={[styles.summaryCard, { borderColor: `${Colors.primary.DEFAULT}40` }]}>
                    <Text style={[styles.summaryCount, { color: Colors.primary.DEFAULT }]}>{summary.exactCount}</Text>
                    <Text style={styles.summaryLabel}>Reached</Text>
                  </View>
                  <View style={[styles.summaryCard, { borderColor: `${Colors.danger.DEFAULT}40` }]}>
                    <Text style={[styles.summaryCount, { color: Colors.danger.DEFAULT }]}>{summary.overCount}</Text>
                    <Text style={styles.summaryLabel}>Over Budget</Text>
                  </View>
                </>
              )}
            </View>

            {/* ── Category Report List ── */}
            <View style={styles.reportList}>
              {reportItems.map(item => {
                const IconComp = ICON_MAP[item.icon] || HelpCircle;
                const status = getBudgetStatus(item.allocatedAmount, item.spentAmount, item.hasBudget);
                const progress = item.hasBudget && item.allocatedAmount > 0 ? item.spentAmount / item.allocatedAmount : 0;
                const catColor = item.color || Colors.primary.DEFAULT;

                return (
                  <View key={item.id} style={styles.reportCard}>
                    <View style={styles.reportCardHeader}>
                      <View style={styles.catTitleGroup}>
                        <View style={[styles.catIconWrap, { backgroundColor: `${catColor}20` }]}>
                          <IconComp size={20} color={catColor} />
                        </View>
                        <Text style={styles.catName}>{item.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${status.color}15`, borderColor: `${status.color}40` }]}>
                        <Text style={[styles.statusBadgeText, { color: status.color }]}>
                          {status.status === 'no_budget' ? 'NO BUDGET SET' : status.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <ProgressBar progress={progress} color={status.color} />

                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Budget</Text>
                        <Text style={styles.metricVal}>
                          {item.hasBudget ? formatCurrency(item.allocatedAmount) : 'Not set'}
                        </Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Spent</Text>
                        <Text style={styles.metricVal}>{formatCurrency(item.spentAmount)}</Text>
                      </View>
                      <View style={styles.metricItemRight}>
                        <Text style={styles.metricLabel}>Status</Text>
                        <Text style={[styles.metricStatusVal, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
    gap: 16,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Theme.shadows.sm,
  },
  monthArrow: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  reportList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    ...Theme.shadows.sm,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricItem: {
    gap: 2,
  },
  metricItemRight: {
    gap: 2,
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  metricStatusVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
