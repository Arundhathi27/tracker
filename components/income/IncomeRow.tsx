import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { Income } from '@/types';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { getIncomeSourceIcon, getIncomeSourceColor } from './IncomeSourceSelect';

interface IncomeRowProps {
  income: Income;
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}

export function IncomeRow({ income, onEdit, onDelete }: IncomeRowProps) {
  const { source, description, amount, date } = income;
  const iconColor = getIncomeSourceColor(source);
  const IconComp = getIncomeSourceIcon(source);
  const txDate = new Date(date + 'T00:00:00');
  const formattedDate = txDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrapper, { backgroundColor: `${iconColor}20` }]}>
        <IconComp size={22} color={iconColor} />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowHeader}>
          <Text style={styles.sourceName} numberOfLines={1}>{source}</Text>
        </View>
        {!!description && description.toLowerCase() !== source.toLowerCase() && description !== 'Income' && (
          <Text style={styles.rowNote} numberOfLines={1}>{description}</Text>
        )}
        <Text style={styles.rowDate}>{formattedDate}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>+{formatCurrency(amount)}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => onEdit(income)} style={styles.actionBtn}>
            <Edit2 size={16} color={Colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(income)} style={styles.actionBtn}>
            <Trash2 size={16} color={Colors.danger.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  rowIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flexShrink: 1,
  },
  rowNote: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success.DEFAULT,
    marginBottom: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
});
