import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, ChevronRight, PieChart, Plus,
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

  // ── Summary Status Breakdown ──
  const summary = useMemo(() => {
    let underCount = 0;
    let exactCount = 0;
    let overCount = 0;

    (categories || []).forEach(cat => {
      const status = getBudgetStatus(cat.allocated_amount, cat.spent_amount);
      if (status.status === 'under') underCount++;
      else if (status.status === 'exact') exactCount++;
      else if (status.status === 'over') overCount++;
    });

    return { underCount, exactCount, overCount };
  }, [categories]);

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
        ) : !categories || categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <PieChart size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No category budgets yet</Text>
            <Text style={styles.emptySubtitle}>Set up budget categories for {monthLabel} to track spending status.</Text>
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
            </View>

            {/* ── Category Report List ── */}
            <View style={styles.reportList}>
              {categories.map((cat: BudgetCategory) => {
                const IconComp = ICON_MAP[cat.icon] || HelpCircle;
                const status = getBudgetStatus(cat.allocated_amount, cat.spent_amount);
                const progress = cat.allocated_amount > 0 ? cat.spent_amount / cat.allocated_amount : 0;
                const catColor = cat.color || Colors.primary.DEFAULT;

                return (
                  <View key={cat.id} style={styles.reportCard}>
                    <View style={styles.reportCardHeader}>
                      <View style={styles.catTitleGroup}>
                        <View style={[styles.catIconWrap, { backgroundColor: `${catColor}20` }]}>
                          <IconComp size={20} color={catColor} />
                        </View>
                        <Text style={styles.catName}>{cat.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${status.color}15`, borderColor: `${status.color}40` }]}>
                        <Text style={[styles.statusBadgeText, { color: status.color }]}>
                          {status.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <ProgressBar progress={progress} color={status.color} />

                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Budget</Text>
                        <Text style={styles.metricVal}>{formatCurrency(cat.allocated_amount)}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Spent</Text>
                        <Text style={styles.metricVal}>{formatCurrency(cat.spent_amount)}</Text>
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
  // Month selector
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
  // Summary row
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
  // Report list
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
  // Empty state
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
