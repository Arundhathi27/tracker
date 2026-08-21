import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useBudgetCategories, useMonthlyBudgetByMonth, useMonthlyBudgets } from '@/hooks/useBudgets';
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
  // Determine month (YYYY-MM) from transaction date
  const dateStr = transactionDate || new Date().toISOString();
  const monthStr = dateStr.slice(0, 7);

  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudgetByMonth(monthStr);
  const { data: categories, isLoading: isCategoriesLoading } = useBudgetCategories(budget?.id || '');
  const { data: allMonthlyBudgets } = useMonthlyBudgets();

  const isLoading = isBudgetLoading || isCategoriesLoading;

  // Unified Category List: Use month budget categories if available; otherwise load user's global / baseline categories
  const activeCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'HelpCircle',
        color: c.color || Colors.primary.DEFAULT,
        allocated_amount: c.allocated_amount,
        spent_amount: c.spent_amount,
        hasBudget: true,
      }));
    }

    // Fallback if NO budget exists for this month
    const list: { id: string; name: string; icon: string; color: string; allocated_amount: number; spent_amount: number; hasBudget: boolean }[] = [];
    const nameSet = new Set<string>();

    if (allMonthlyBudgets) {
      allMonthlyBudgets.forEach(mb => {
        if (mb.budget_categories) {
          mb.budget_categories.forEach((cat: any) => {
            if (cat.name && !nameSet.has(cat.name.toLowerCase().trim())) {
              nameSet.add(cat.name.toLowerCase().trim());
              list.push({
                id: cat.id,
                name: cat.name,
                icon: cat.icon || 'HelpCircle',
                color: cat.color || Colors.primary.DEFAULT,
                allocated_amount: 0,
                spent_amount: 0,
                hasBudget: false,
              });
            }
          });
        }
      });
    }

    // Standard baseline categories
    const BASELINE = [
      { name: 'Groceries', icon: 'ShoppingBag', color: '#6B4F3A' },
      { name: 'Rent', icon: 'Zap', color: '#C65A5A' },
      { name: 'Vegetables', icon: 'Utensils', color: '#4A7C59' },
      { name: 'Food', icon: 'Coffee', color: '#D97706' },
      { name: 'Transport', icon: 'Car', color: '#2563EB' },
      { name: 'Travel', icon: 'Car', color: '#3B82F6' },
      { name: 'Fuel', icon: 'Car', color: '#EF4444' },
      { name: 'Bills', icon: 'Smartphone', color: '#8B5CF6' },
      { name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
      { name: 'Gifts', icon: 'Heart', color: '#F43F5E' },
      { name: 'Health', icon: 'Heart', color: '#10B981' },
      { name: 'Personal Care', icon: 'Heart', color: '#06B6D4' },
      { name: 'Housing', icon: 'Zap', color: '#6366F1' },
      { name: 'Recharge', icon: 'Smartphone', color: '#8B5CF6' },
      { name: 'Family', icon: 'Heart', color: '#F59E0B' },
      { name: 'Transfer', icon: 'Briefcase', color: '#64748B' },
      { name: 'Other', icon: 'HelpCircle', color: '#6B7280' },
    ];

    BASELINE.forEach(c => {
      if (!nameSet.has(c.name.toLowerCase())) {
        nameSet.add(c.name.toLowerCase());
        list.push({
          id: `std-${c.name.toLowerCase()}`,
          name: c.name,
          icon: c.icon,
          color: c.color,
          allocated_amount: 0,
          spent_amount: 0,
          hasBudget: false,
        });
      }
    });

    return list;
  }, [categories, allMonthlyBudgets]);

  if (isLoading) {
    return <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ padding: 20 }} />;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>

      <View style={styles.grid}>
        {activeCategories.map((cat) => {
          const isSelected = value === cat.id || (value && value.toLowerCase().includes(cat.name.toLowerCase()));
          const iconName = cat.icon || 'HelpCircle';
          const iconColor = cat.color || Colors.primary.DEFAULT;
          const IconComp = ICON_MAP[iconName] || HelpCircle;
          const status = getBudgetStatus(cat.allocated_amount, cat.spent_amount, cat.hasBudget);

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
