import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { MonthlyBudget } from '@/types';
import { formatCurrency } from '@/utils/formatters';

import { getBudgetStatus } from '@/utils/budgetStatus';

interface BudgetCardProps {
  budget: MonthlyBudget;
  onPress?: (budget: MonthlyBudget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onPress }) => {
  const { month, total_amount, budget_categories } = budget;
  
  const spent = budget_categories?.reduce((acc, cat) => acc + cat.spent, 0) || 0;
  const status = getBudgetStatus(total_amount, spent);
  const percentage = Math.min((spent / total_amount) * 100, 100);
  
  let progressColor: string = Colors.primary.DEFAULT;
  if (status.status === 'over') progressColor = Colors.danger.DEFAULT;
  else if (status.status === 'near' || status.status === 'exact') progressColor = Colors.warning.DEFAULT;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(budget)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{month}</Text>
        </View>
        <Text style={styles.period}>Monthly</Text>
      </View>

      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.spentLabel}>Spent</Text>
          <Text style={styles.spentAmount}>{formatCurrency(spent)}</Text>
        </View>
        <View style={styles.remainingContainer}>
          <Text style={styles.remainingLabel}>Status</Text>
          <Text style={[
            styles.remainingAmount, 
            { color: status.color }
          ]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${percentage}%`, backgroundColor: progressColor }
          ]} 
        />
      </View>
      
      <View style={styles.progressFooter}>
        <Text style={styles.percentageText}>{((spent / total_amount) * 100).toFixed(0)}% used</Text>
        <Text style={styles.totalText}>of {formatCurrency(total_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  period: {
    fontSize: 13,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    fontWeight: '500',
    backgroundColor: Colors.background.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.md,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  spentLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  remainingContainer: {
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
});
