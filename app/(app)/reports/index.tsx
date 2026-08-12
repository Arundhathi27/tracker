import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
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

  // Data hooks
  const { data: budget, isLoading: loadingBudget } = useMonthlyBudgetByMonth(monthKey);
  const { data: categories, isLoading: loadingCats } = useBudgetCategories(budget?.id || '');
  const { data: expenses, isLoading: loadingExpenses } = useTransactions({
    type: 'expense',
    dateStart,
    dateEnd,
    sortBy: 'date',
    sortOrder: 'asc',
  });
  const { data: income, isLoading: loadingIncome } = useIncomeList({
    dateStart,
    dateEnd,
  });

  const isLoading = loadingBudget || loadingCats || loadingExpenses || loadingIncome;

  // ── Analytics computations ────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const totalBudget = budget?.total_amount || 0;
    const totalSpent = categories?.reduce((s, c) => s + c.spent_amount, 0) || 0;
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

    // Pie chart: spending per category (only categories with spending)
    const catTotals: Record<string, { name: string; spent: number; color: string; icon: string }> = {};
    (expenses || []).forEach(tx => {
      if (!tx.category_id) return;
      const cat = categories?.find(c => c.id === tx.category_id);
      if (!cat) return;
      if (!catTotals[cat.id]) {
        catTotals[cat.id] = { name: cat.name, spent: 0, color: cat.color || Colors.primary.DEFAULT, icon: cat.icon || 'HelpCircle' };
      }
      catTotals[cat.id].spent += tx.amount;
    });

    const catTotalArr = Object.values(catTotals).sort((a, b) => b.spent - a.spent);

    const pieData = catTotalArr.map((c, i) => ({
      name: c.name,
      amount: c.spent,
      color: PIE_COLORS[i % PIE_COLORS.length],
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

    // Insights
    const insights: string[] = [];
    if (topCat) {
      insights.push(`You spent the most on ${topCat.name} this month (${formatCurrency(topCat.spent)}).`);
    }
    (categories || []).forEach(c => {
      const pct = c.allocated_amount > 0 ? Math.round((c.spent_amount / c.allocated_amount) * 100) : 0;
      if (pct >= 90) {
        insights.push(`Your ${c.name} budget is ${pct}% used.`);
      }
    });
    if (remaining > 0) {
      insights.push(`You have ${formatCurrency(remaining)} remaining budget this month.`);
    } else if (remaining < 0) {
      insights.push(`You are over budget by ${formatCurrency(-remaining)} this month.`);
    }
    if (totalTx === 0) {
      insights.push('No expenses recorded this month yet.');
    }

    if (totalIncome > 0) {
      insights.push(`You have recorded ${formatCurrency(totalIncome)} in income this month.`);
    }

    return {
      totalBudget, totalSpent, remaining, totalTx, totalCats, totalIncome,
      pieData, incomePieData, lineData, catTotalArr, pmTotalArr, topCat, insights, daysInMonth,
      hasExpenses: totalTx > 0,
      hasIncome: totalIncome > 0,
    };
  }, [budget, categories, expenses, income, month, year]);

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

            {/* ── Category Breakdown (always shown if budget exists) ── */}
            {budget && categories && categories.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Category Breakdown</Text>
                <View style={styles.catBreakdownList}>
                  {categories.map((cat: BudgetCategory) => {
                    const IconComp = ICON_MAP[cat.icon] || HelpCircle;
                    const color = cat.color || Colors.primary.DEFAULT;
                    const pct = cat.allocated_amount > 0
                      ? Math.round((cat.spent_amount / cat.allocated_amount) * 100) : 0;
                    const remaining = cat.allocated_amount - cat.spent_amount;
                    const progress = cat.allocated_amount > 0
                      ? cat.spent_amount / cat.allocated_amount : 0;

                    return (
                      <View key={cat.id} style={styles.catBreakdownRow}>
                        <View style={[styles.catBreakdownIcon, { backgroundColor: `${color}20` }]}>
                          <IconComp size={20} color={color} />
                        </View>
                        <View style={styles.catBreakdownBody}>
                          <View style={styles.catBreakdownTop}>
                            <Text style={styles.catBreakdownName}>{cat.name}</Text>
                            <Text style={[styles.catBreakdownPct,
                              pct >= 100 ? { color: Colors.danger.DEFAULT } :
                              pct >= 80 ? { color: Colors.warning.DEFAULT } : {}
                            ]}>{pct}%</Text>
                          </View>
                          <ProgressBar progress={progress} color={color} />
                          <View style={styles.catBreakdownBottom}>
                            <Text style={styles.catMeta}>Allocated {formatCurrency(cat.allocated_amount)}</Text>
                            <Text style={styles.catMeta}>Spent {formatCurrency(cat.spent_amount)}</Text>
                            <Text style={[styles.catMeta,
                              remaining < 0 ? { color: Colors.danger.DEFAULT } : { color: Colors.success.DEFAULT }
                            ]}>
                              {remaining >= 0 ? `Left ${formatCurrency(remaining)}` : `Over ${formatCurrency(-remaining)}`}
                            </Text>
                          </View>
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

            {/* ── Insights ── */}
            {analytics.insights.length > 0 && (
              <View style={styles.card}>
                <View style={styles.insightHeader}>
                  <Lightbulb size={18} color={Colors.accent.DEFAULT} />
                  <Text style={styles.cardTitle}>Insights</Text>
                </View>
                <View style={styles.insightsList}>
                  {analytics.insights.map((insight, i) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={styles.insightBullet} />
                      <Text style={styles.insightText}>{insight}</Text>
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
});
