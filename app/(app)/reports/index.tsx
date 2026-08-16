import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart, LineChart } from 'react-native-chart-kit';
import {
  ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone,
  Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle,
  ChevronLeft, ChevronRight, TrendingUp, Lightbulb, Trophy, Wallet
} from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { useMonthlyBudgetByMonth, useBudgetCategories } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useIncomeList } from '@/hooks/useIncome';
import { getIncomeSourceColor } from '@/components/income/IncomeSourceSelect';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { generateSpendingInsights } from '@/utils/spendingInsights';
import { BudgetCategory } from '@/types';

const screenWidth = Dimensions.get('window').width - 40; // 20px padding each side

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone,
  Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle,
};

// ─── Pie slice colours ────────────────────────────────────────────────────────
const PIE_COLORS = [
  '#6B4F3A', '#C9A86A', '#4F8A5B', '#C65A5A',
  '#D4A373', '#8B622C', '#3D6C46', '#AA8866', '#774433',
];

// ─── Month helpers ────────────────────────────────────────────────────────────
import { toISOMonth } from '@/utils/date';

function generateMonthList() {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({
      key: toISOMonth(d),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth(), // 0-indexed
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress, color = Colors.primary.DEFAULT }: { progress: number; color?: string }) {
  const pct = Math.min(Math.max(progress, 0), 1);
  const isOver = progress > 1;
  return (
    <View style={pbStyles.bg}>
      <View style={[pbStyles.fill, {
        width: `${pct * 100}%`,
        backgroundColor: isOver ? Colors.danger.DEFAULT : color
      }]} />
    </View>
  );
}
const pbStyles = StyleSheet.create({
  bg: { height: 7, backgroundColor: Colors.border.DEFAULT, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [monthIdx, setMonthIdx] = useState(0);
  
  // Generated dynamically to prevent stale module-level caching
  const monthsList = React.useMemo(() => generateMonthList(), []);
  const { key: monthKey, label: monthLabel, year, month } = monthsList[monthIdx];
  
  const { dateStart, dateEnd } = getDateRange(year, month);

  // Previous month calculation with year boundary support (e.g. Jan 2027 vs Dec 2026)
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const { dateStart: prevDateStart, dateEnd: prevDateEnd } = getDateRange(prevYear, prevMonth);
  const prevMonthLabel = new Date(prevYear, prevMonth, 1).toLocaleString('default', { month: 'long' });

  // Data hooks
  const { data: budget, isLoading: loadingBudget, refetch: refetchBudget } = useMonthlyBudgetByMonth(monthKey);
  const { data: categories, isLoading: loadingCats, refetch: refetchCats } = useBudgetCategories(budget?.id || '');
  const { data: expenses, isLoading: loadingExpenses, refetch: refetchExpenses } = useTransactions({
    type: 'expense',
    dateStart,
    dateEnd,
    sortBy: 'date',
    sortOrder: 'asc',
  });
  const { data: prevExpenses, isLoading: loadingPrevExpenses, refetch: refetchPrevExpenses } = useTransactions({
    type: 'expense',
    dateStart: prevDateStart,
    dateEnd: prevDateEnd,
  });
  const { data: income, isLoading: loadingIncome, refetch: refetchIncome } = useIncomeList({
    dateStart,
    dateEnd,
  });

  const handleRefresh = useCallback(() => {
    refetchBudget();
    refetchCats();
    refetchExpenses();
    refetchPrevExpenses();
    refetchIncome();
  }, [refetchBudget, refetchCats, refetchExpenses, refetchPrevExpenses, refetchIncome]);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  const isLoading = loadingBudget || loadingCats || loadingExpenses || loadingPrevExpenses || loadingIncome;

  // ── Analytics computations ────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const totalBudget = budget?.total_amount || 0;
    const totalSpent = (expenses || []).reduce((s, tx) => s + tx.amount, 0);
    const prevTotalSpent = (prevExpenses || []).reduce((s, tx) => s + tx.amount, 0);
    const hasPrevData = (prevExpenses || []).length > 0;
    const monthDiff = totalSpent - prevTotalSpent;
    const absMonthDiff = Math.abs(monthDiff);
    const remaining = totalBudget - totalSpent;
    const totalTx = expenses?.length || 0;
    const totalCats = categories?.length || 0;
    const totalIncome = income?.reduce((s, i) => s + i.amount, 0) || 0;

    // Income Pie chart
    const incomeSourceTotals: Record<string, { spent: number; color: string }> = {};
    (income || []).forEach(inc => {
      if (!incomeSourceTotals[inc.source]) {
        incomeSourceTotals[inc.source] = { spent: 0, color: getIncomeSourceColor(inc.source) };
      }
      incomeSourceTotals[inc.source].spent += inc.amount;
    });
    
    const incomePieData = Object.keys(incomeSourceTotals).map(source => ({
      name: source,
      amount: incomeSourceTotals[source].spent,
      color: incomeSourceTotals[source].color,
      legendFontColor: Colors.text.secondary,
      legendFontSize: 11,
    }));

    // Spending per category (sorted by highest spending first)
    const catTotals: Record<string, { id: string; name: string; spent: number; color: string; icon: string }> = {};
    (expenses || []).forEach(tx => {
      const catId = tx.category_id || 'uncategorized';
      const cat = categories?.find(c => c.id === tx.category_id);
      const catName = cat?.name || tx.category?.name || 'Uncategorized';
      const catColor = cat?.color || tx.category?.color || Colors.primary.DEFAULT;
      const catIcon = cat?.icon || tx.category?.icon || 'HelpCircle';

      if (!catTotals[catId]) {
        catTotals[catId] = { id: catId, name: catName, spent: 0, color: catColor, icon: catIcon };
      }
      catTotals[catId].spent += tx.amount;
    });

    const catTotalArr = Object.values(catTotals).sort((a, b) => b.spent - a.spent);

    const pieData = catTotalArr.map((c, i) => ({
      name: c.name,
      amount: c.spent,
      color: c.color || PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: Colors.text.secondary,
      legendFontSize: 11,
    }));

    // Payment Methods Breakdown
    const pmTotals: Record<string, { name: string; spent: number; count: number }> = {};
    (expenses || []).forEach(tx => {
      if (tx.payment_method_id && tx.payment_method) {
        const pmId = tx.payment_method_id;
        if (!pmTotals[pmId]) {
          pmTotals[pmId] = { name: tx.payment_method.name, spent: 0, count: 0 };
        }
        pmTotals[pmId].spent += tx.amount;
        pmTotals[pmId].count++;
      } else {
        if (!pmTotals['untracked']) {
          pmTotals['untracked'] = { name: 'Not Specified', spent: 0, count: 0 };
        }
        pmTotals['untracked'].spent += tx.amount;
        pmTotals['untracked'].count++;
      }
    });
    const pmTotalArr = Object.values(pmTotals).sort((a, b) => b.spent - a.spent);

    // Line chart: daily spending & income for this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyTotals = Array(daysInMonth).fill(0);
    const dailyIncomeTotals = Array(daysInMonth).fill(0);

    (expenses || []).forEach(tx => {
      const d = new Date(tx.date + 'T00:00:00');
      if (d.getMonth() === month && d.getFullYear() === year) {
        dailyTotals[d.getDate() - 1] += tx.amount;
      }
    });

    (income || []).forEach(inc => {
      const d = new Date(inc.date + 'T00:00:00');
      if (d.getMonth() === month && d.getFullYear() === year) {
        dailyIncomeTotals[d.getDate() - 1] += inc.amount;
      }
    });

    // Show every 5th day as label to avoid crowding
    const lineLabels = dailyTotals.map((_, i) =>
      (i + 1) % 5 === 0 || i === 0 || i === daysInMonth - 1 ? `${i + 1}` : ''
    );
    const lineData = {
      labels: lineLabels,
      datasets: [
        {
          data: dailyTotals.map(v => v || 0),
          color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`, // Danger color for expense
          strokeWidth: 2,
        },
        {
          data: dailyIncomeTotals.map(v => v || 0),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Success color for income
          strokeWidth: 2,
        }
      ],
    };

    // Top spending category
    const topCat = catTotalArr[0] || null;

    // Structured spending insights
    const structuredCategories = (categories || []).map(c => ({
      name: c.name,
      allocated_amount: c.allocated_amount,
      spent_amount: c.spent_amount,
    }));
    const spendingInsights = generateSpendingInsights(
      totalBudget,
      structuredCategories,
      totalSpent,
      totalTx > 0,
      prevTotalSpent,
      hasPrevData
    );

    return {
      totalBudget, totalSpent, prevTotalSpent, hasPrevData, monthDiff, absMonthDiff, prevMonthLabel,
      remaining, totalTx, totalCats, totalIncome,
      pieData, incomePieData, lineData, catTotalArr, pmTotalArr, topCat, spendingInsights, daysInMonth,
      hasExpenses: totalTx > 0,
      hasIncome: totalIncome > 0,
    };
  }, [budget, categories, expenses, prevExpenses, income, month, year, prevMonthLabel]);

  const chartConfig = {
    backgroundGradientFrom: Colors.surface.DEFAULT,
    backgroundGradientTo: Colors.surface.DEFAULT,
    color: (opacity = 1) => `rgba(107, 79, 58, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(120, 100, 80, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForDots: { r: '3', strokeWidth: '1', stroke: Colors.primary.DEFAULT },
  };

  return (
    <View style={styles.container}>
      <Header title="Reports" />

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
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <View style={styles.summaryGrid}>
              {[
                { label: 'Total Income', value: formatCurrency(analytics.totalIncome), color: Colors.success.DEFAULT },
                { label: 'Total Spent', value: formatCurrency(analytics.totalSpent), color: Colors.danger.DEFAULT },
                { label: 'Monthly Budget', value: formatCurrency(analytics.totalBudget), color: Colors.primary.DEFAULT },
                { label: 'Savings', value: formatCurrency(analytics.totalIncome - analytics.totalSpent), color: (analytics.totalIncome - analytics.totalSpent) > 0 ? Colors.success.DEFAULT : (analytics.totalIncome - analytics.totalSpent) < 0 ? Colors.danger.DEFAULT : Colors.primary.DEFAULT },
              ].map(item => (
                <View key={item.label} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Monthly Comparison Card ── */}
            <View style={styles.card}>
              <View style={styles.comparisonHeader}>
                <TrendingUp size={20} color={Colors.primary.DEFAULT} />
                <Text style={styles.cardTitle}>Monthly Comparison</Text>
              </View>

              {!analytics.hasPrevData ? (
                <Text style={styles.cardSubtitle}>
                  No spending data recorded for {analytics.prevMonthLabel} to compare.
                </Text>
              ) : (
                <View style={styles.comparisonBody}>
                  <View style={styles.comparisonGrid}>
                    <View style={styles.comparisonCol}>
                      <Text style={styles.comparisonLabel}>{analytics.prevMonthLabel}</Text>
                      <Text style={styles.comparisonVal}>{formatCurrency(analytics.prevTotalSpent)}</Text>
                    </View>
                    <View style={styles.comparisonCol}>
                      <Text style={styles.comparisonLabel}>{monthLabel.split(' ')[0]}</Text>
                      <Text style={styles.comparisonVal}>{formatCurrency(analytics.totalSpent)}</Text>
                    </View>
                    <View style={styles.comparisonCol}>
                      <Text style={styles.comparisonLabel}>Difference</Text>
                      <Text style={[
                        styles.comparisonVal,
                        analytics.monthDiff > 0 ? { color: Colors.danger.DEFAULT } : analytics.monthDiff < 0 ? { color: Colors.success.DEFAULT } : { color: Colors.text.primary }
                      ]}>
                        {analytics.monthDiff > 0 ? `+${formatCurrency(analytics.monthDiff)}` : analytics.monthDiff < 0 ? `-${formatCurrency(analytics.absMonthDiff)}` : '₹0'}
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.comparisonBanner,
                    analytics.monthDiff > 0 ? { backgroundColor: `${Colors.danger.DEFAULT}15` } : analytics.monthDiff < 0 ? { backgroundColor: `${Colors.success.DEFAULT}15` } : { backgroundColor: `${Colors.primary.DEFAULT}15` }
                  ]}>
                    <Text style={[
                      styles.comparisonBannerText,
                      analytics.monthDiff > 0 ? { color: Colors.danger.DEFAULT } : analytics.monthDiff < 0 ? { color: Colors.success.DEFAULT } : { color: Colors.primary.DEFAULT }
                    ]}>
                      {analytics.monthDiff > 0 
                        ? `You spent ₹${analytics.absMonthDiff.toLocaleString('en-IN')} more than last month.`
                        : analytics.monthDiff < 0
                        ? `You spent ₹${analytics.absMonthDiff.toLocaleString('en-IN')} less than last month.`
                        : `You spent the exact same amount as last month.`}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {!analytics.hasExpenses ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No spending data available for this month.</Text>
                <Text style={styles.emptySubtitle}>Add expenses to see your analytics.</Text>
              </View>
            ) : (
              <>
                {/* ── Pie Chart: Category Analysis ── */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Category Analysis</Text>
                  <PieChart
                    data={analytics.pieData}
                    width={screenWidth - 32}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    center={[0, 0]}
                    hasLegend
                  />
                  {/* Percentage breakdown below pie */}
                  <View style={styles.pieLegend}>
                    {analytics.pieData.map((d, i) => {
                      const pct = analytics.totalSpent > 0
                        ? Math.round((d.amount / analytics.totalSpent) * 100) : 0;
                      return (
                        <View key={d.name} style={styles.pieLegendRow}>
                          <View style={[styles.pieDot, { backgroundColor: d.color }]} />
                          <Text style={styles.pieLegendName} numberOfLines={1}>{d.name}</Text>
                          <Text style={styles.pieLegendPct}>{pct}%</Text>
                          <Text style={styles.pieLegendAmt}>{formatCurrency(d.amount)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {analytics.hasIncome && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Income Analysis</Text>
                <PieChart
                  data={analytics.incomePieData}
                  width={screenWidth - 32}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  center={[0, 0]}
                  hasLegend
                />
                <View style={styles.pieLegend}>
                  {analytics.incomePieData.map((d, i) => {
                    const pct = analytics.totalIncome > 0
                      ? Math.round((d.amount / analytics.totalIncome) * 100) : 0;
                    return (
                      <View key={d.name} style={styles.pieLegendRow}>
                        <View style={[styles.pieDot, { backgroundColor: d.color }]} />
                        <Text style={styles.pieLegendName} numberOfLines={1}>{d.name}</Text>
                        <Text style={styles.pieLegendPct}>{pct}%</Text>
                        <Text style={styles.pieLegendAmt}>{formatCurrency(d.amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {(!analytics.hasExpenses && !analytics.hasIncome) ? null : (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Daily Spending Trend</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.cardSubtitle, { marginBottom: 0 }]}>{monthLabel}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success.DEFAULT }} />
                        <Text style={{ fontSize: 12, color: Colors.text.secondary }}>Income</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger.DEFAULT }} />
                        <Text style={{ fontSize: 12, color: Colors.text.secondary }}>Expenses</Text>
                      </View>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={analytics.lineData}
                      width={Math.max(screenWidth - 32, analytics.daysInMonth * 18)}
                      height={200}
                      chartConfig={chartConfig}
                      bezier
                      fromZero={true}
                      style={{ ...styles.chartStyle, paddingRight: 0, paddingBottom: 0 }}
                      withDots={true}
                      withShadow={false}
                      withInnerLines={false}
                      formatYLabel={(v) => `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`}
                    />
                  </ScrollView>
                </View>

                {/* ── Top Spending Category ── */}
                {analytics.topCat && (
                  <View style={[styles.card, styles.topCatCard]}>
                    <View style={styles.topCatHeader}>
                      <Trophy size={20} color={Colors.accent.DEFAULT} />
                      <Text style={styles.cardTitle}>Top Spending Category</Text>
                    </View>
                    <View style={styles.topCatBody}>
                      {(() => {
                        const IconComp = ICON_MAP[analytics.topCat.icon] || HelpCircle;
                        const pct = analytics.totalSpent > 0
                          ? Math.round((analytics.topCat.spent / analytics.totalSpent) * 100) : 0;
                        return (
                          <>
                            <View style={[styles.topCatIcon, { backgroundColor: `${analytics.topCat.color}20` }]}>
                              <IconComp size={28} color={analytics.topCat.color} />
                            </View>
                            <View style={styles.topCatInfo}>
                              <Text style={styles.topCatName}>{analytics.topCat.name}</Text>
                              <Text style={styles.topCatAmount}>{formatCurrency(analytics.topCat.spent)}</Text>
                              <Text style={styles.topCatPct}>{pct}% of total spending</Text>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* ── Category Breakdown ("Where Did My Money Go?") ── */}
            {analytics.catTotalArr && analytics.catTotalArr.length > 0 && (
              <View style={styles.card}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.cardTitle}>Where Did My Money Go?</Text>
                  <Text style={styles.cardSubtitle}>Category breakdown by highest spending</Text>
                </View>
                <View style={styles.catBreakdownList}>
                  {analytics.catTotalArr.map((cat) => {
                    const IconComp = ICON_MAP[cat.icon] || HelpCircle;
                    const color = cat.color || Colors.primary.DEFAULT;
                    const pct = analytics.totalSpent > 0
                      ? Math.round((cat.spent / analytics.totalSpent) * 100) : 0;
                    const progress = analytics.totalSpent > 0 ? cat.spent / analytics.totalSpent : 0;

                    return (
                      <View key={cat.id} style={styles.catBreakdownRow}>
                        <View style={[styles.catBreakdownIcon, { backgroundColor: `${color}20` }]}>
                          <IconComp size={20} color={color} />
                        </View>
                        <View style={styles.catBreakdownBody}>
                          <View style={styles.catBreakdownTop}>
                            <Text style={styles.catBreakdownName}>{cat.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={styles.catBreakdownAmt}>{formatCurrency(cat.spent)}</Text>
                              <Text style={styles.catBreakdownPct}>{pct}%</Text>
                            </View>
                          </View>
                          <ProgressBar progress={progress} color={color} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Payment Methods Breakdown ── */}
            {analytics.pmTotalArr && analytics.pmTotalArr.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Methods</Text>
                <View style={styles.catBreakdownList}>
                  {analytics.pmTotalArr.map((pm, idx) => {
                    const IconComp = Wallet; // generic for all payment methods in reports
                    const color = Colors.accent.DEFAULT;
                    const pct = analytics.totalSpent > 0
                      ? Math.round((pm.spent / analytics.totalSpent) * 100) : 0;
                    const progress = analytics.totalSpent > 0
                      ? pm.spent / analytics.totalSpent : 0;

                    return (
                      <View key={`pm-${idx}`} style={styles.catBreakdownRow}>
                        <View style={[styles.catBreakdownIcon, { backgroundColor: `${color}20` }]}>
                          <IconComp size={20} color={color} />
                        </View>
                        <View style={styles.catBreakdownBody}>
                          <View style={styles.catBreakdownTop}>
                            <Text style={styles.catBreakdownName}>{pm.name}</Text>
                            <Text style={styles.catBreakdownPct}>{pct}%</Text>
                          </View>
                          <ProgressBar progress={progress} color={color} />
                          <View style={styles.catBreakdownBottom}>
                            <Text style={styles.catMeta}>Spent {formatCurrency(pm.spent)}</Text>
                            <Text style={styles.catMeta}>{pm.count} {pm.count === 1 ? 'transaction' : 'transactions'}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Spending Insights ── */}
            {analytics.spendingInsights && analytics.spendingInsights.length > 0 && (
              <View style={styles.card}>
                <View style={styles.insightHeader}>
                  <Lightbulb size={18} color={Colors.accent.DEFAULT} />
                  <Text style={styles.cardTitle}>Spending Insights</Text>
                </View>
                <View style={styles.insightsList}>
                  {analytics.spendingInsights.map((insight) => (
                    <View key={insight.id} style={styles.insightRow}>
                      <Text style={{ fontSize: 16 }}>{insight.icon}</Text>
                      <Text style={styles.insightText}>{insight.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
  // Summary
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 14,
    minWidth: '47%',
    flex: 1,
    ...Theme.shadows.sm,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  // Cards
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    ...Theme.shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 12,
  },
  chartStyle: {
    marginTop: 8,
    borderRadius: 12,
    marginLeft: -16,
  },
  // Pie Legend
  pieLegend: {
    marginTop: 12,
    gap: 8,
  },
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  pieLegendName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  pieLegendPct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    width: 36,
    textAlign: 'right',
  },
  pieLegendAmt: {
    fontSize: 13,
    color: Colors.text.secondary,
    width: 80,
    textAlign: 'right',
  },
  // Top category
  topCatCard: {
    borderColor: `${Colors.accent.DEFAULT}50`,
  },
  topCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  topCatBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topCatIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCatInfo: {
    flex: 1,
  },
  topCatName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  topCatAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.danger.DEFAULT,
    marginBottom: 2,
  },
  topCatPct: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  // Category breakdown
  catBreakdownList: {
    gap: 16,
    marginTop: 8,
  },
  catBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  catBreakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  catBreakdownBody: {
    flex: 1,
    gap: 6,
  },
  catBreakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBreakdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  catBreakdownAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  catBreakdownPct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  catBreakdownBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  catMeta: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  // Insights
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightsList: {
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.DEFAULT,
    marginTop: 6,
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  // Empty
  emptyCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  // Comparison Card
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  comparisonBody: {
    gap: 12,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 12,
  },
  comparisonCol: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  comparisonVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  comparisonBanner: {
    borderRadius: Theme.radius.lg,
    padding: 12,
    alignItems: 'center',
  },
  comparisonBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
