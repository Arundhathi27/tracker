import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react-native';
import { Transaction } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';

interface TransactionListItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionListItem: React.FC<TransactionListItemProps> = ({ transaction, onPress }) => {
  const { type, amount, description, date, category, payment_method } = transaction;

  const isExpense = type === 'expense';
  const isIncome = type === 'income';

  let icon = <RefreshCcw size={20} color={Colors.text.secondary} />;
  let iconBg = `${Colors.text.secondary}20`;
  let amountColor: string = Colors.text.primary;

  if (isExpense) {
    icon = <ArrowUpRight size={20} color={Colors.danger.DEFAULT} />;
    iconBg = `${Colors.danger.DEFAULT}20`;
  } else if (isIncome) {
    icon = <ArrowDownRight size={20} color={Colors.success.DEFAULT} />;
    iconBg = `${Colors.success.DEFAULT}20`;
    amountColor = Colors.success.DEFAULT;
  }

  // Format date nicely (e.g. "Today", "Yesterday", or "Oct 24")
  const txDate = new Date(date);
  const formattedDate = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>{description}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{category?.name || 'Uncategorized'}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{payment_method?.name || 'No Method'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(amount)}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.DEFAULT,
    marginHorizontal: 6,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});
