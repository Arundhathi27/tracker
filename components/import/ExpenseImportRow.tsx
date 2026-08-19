import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { ParsedImportRow } from '@/utils/importParser';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseImportRowProps {
  row: ParsedImportRow;
  mappedCategory: string;
  isDuplicate?: boolean;
  isSkipped?: boolean;
}

export const ExpenseImportRow: React.FC<ExpenseImportRowProps> = ({
  row,
  mappedCategory,
  isDuplicate = false,
  isSkipped = false,
}) => {
  const formattedDate = row.date
    ? new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : row.rawDate || '—';

  return (
    <View style={[styles.card, (!row.isValid || isSkipped) && styles.cardWarning]}>
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <Text style={styles.rowBadge}>Row {row.rowNumber}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <Text style={styles.amountText}>
          {row.amount ? formatCurrency(row.amount) : row.rawAmount || '—'}
        </Text>
      </View>

      <View style={styles.midRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText} numberOfLines={1}>{mappedCategory}</Text>
        </View>
        {!!row.paymentMethodName && (
          <Text style={styles.pmText} numberOfLines={1}>• {row.paymentMethodName}</Text>
        )}
      </View>

      {!!row.description && row.description !== mappedCategory && (
        <Text style={styles.noteText} numberOfLines={2}>Note: {row.description}</Text>
      )}

      {/* Validation Status Badge */}
      <View style={styles.statusRow}>
        {isSkipped ? (
          <View style={styles.tagSkipped}>
            <Text style={styles.tagSkippedText}>Skipped (Duplicate)</Text>
          </View>
        ) : row.isValid ? (
          <View style={styles.tagReady}>
            <Text style={styles.tagReadyText}>✓ Ready to Import</Text>
          </View>
        ) : (
          <View style={styles.tagInvalid}>
            <Text style={styles.tagInvalidText}>⚠ {row.errorReason || 'Needs Attention'}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    gap: 8,
    ...Theme.shadows.sm,
  },
  cardWarning: {
    backgroundColor: `${Colors.danger.DEFAULT}08`,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.tertiary,
    backgroundColor: Colors.background.DEFAULT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  pmText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  noteText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  statusRow: {
    marginTop: 2,
  },
  tagReady: {
    backgroundColor: `${Colors.success.DEFAULT}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success.DEFAULT,
  },
  tagSkipped: {
    backgroundColor: `${Colors.text.tertiary}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagSkippedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tagInvalid: {
    backgroundColor: `${Colors.danger.DEFAULT}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagInvalidText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
  },
});
