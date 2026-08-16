import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useBudgetCategories, useMonthlyBudgetByMonth } from '@/hooks/useBudgets';
import { BudgetCategory } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { getBudgetStatus } from '@/utils/budgetStatus';
import {
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle
} from 'lucide-react-native';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle
};

interface CategorySelectProps {
  value?: string | null;
  onChange: (categoryId: string) => void;
  error?: string;
  transactionDate?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, error, transactionDate }) => {
  // Determine which month's budget to load (default to current month)
  const dateStr = transactionDate || new Date().toISOString();
  const monthStr = dateStr.slice(0, 7); // YYYY-MM

  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudgetByMonth(monthStr);
  const { data: categories, isLoading: isCategoriesLoading } = useBudgetCategories(budget?.id || '');

  const isLoading = isBudgetLoading || isCategoriesLoading;

  if (isLoading) {
    return <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ padding: 20 }} />;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>

      {!budget ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            No budget found for {monthStr}. Please create a monthly budget first.
          </Text>
        </View>
      ) : categories?.length === 0 ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            No categories set for {monthStr}. Please add categories to your budget.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {categories?.map((cat: BudgetCategory) => {
            const isSelected = value === cat.id;
            const iconName = cat.icon || 'HelpCircle';
            const iconColor = cat.color || Colors.primary.DEFAULT;
            const IconComp = ICON_MAP[iconName] || HelpCircle;
            const status = getBudgetStatus(cat.allocated_amount, cat.spent_amount);

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  isSelected && { borderColor: iconColor, borderWidth: 2 }
                ]}
                onPress={() => onChange(cat.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
                  <IconComp size={20} color={iconColor} />
                </View>
                <Text style={[styles.catName, isSelected && { color: iconColor }]} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={[styles.catRemaining, { color: status.status === 'over' ? status.color : Colors.text.tertiary }]} numberOfLines={1}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  required: {
    color: Colors.danger.DEFAULT,
  },
  warningBox: {
    backgroundColor: `${Colors.warning.DEFAULT}15`,
    borderRadius: Theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.warning.DEFAULT}30`,
  },
  warningText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  catRemaining: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 8,
  },
});
