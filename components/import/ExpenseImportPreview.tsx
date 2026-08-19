import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  CheckCircle2, AlertTriangle, Sparkles, Copy, Calendar, XCircle, Check
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { ParsedImportRow } from '@/utils/importParser';
import { CategoryMatchResult, matchCategoryName } from '@/utils/categoryMatcher';
import { checkIsDuplicate } from '@/utils/duplicateDetector';
import { ExpenseImportRow } from './ExpenseImportRow';
import { ImportResultSummary } from '@/services/expenseImportService';
import { categoryMappingService } from '@/services/categoryMappingService';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseImportPreviewProps {
  parsedRows: ParsedImportRow[];
  userCategoryNames: string[];
  categoryMappings: Record<string, string>;
  onCategoryMappingChange: (rawCat: string, targetCat: string) => void;
  existingUserTxs: Transaction[];
  skipDuplicatesMap: Record<number, boolean>;
  onToggleSkipDuplicate: (rowNumber: number) => void;
  onConfirmImport: () => void;
  onBack: () => void;
  importResult: ImportResultSummary | null;
  onDone: () => void;
}

export const ExpenseImportPreview: React.FC<ExpenseImportPreviewProps> = ({
  parsedRows,
  userCategoryNames,
  categoryMappings,
  onCategoryMappingChange,
  existingUserTxs,
  skipDuplicatesMap,
  onToggleSkipDuplicate,
  onConfirmImport,
  onBack,
  importResult,
  onDone,
}) => {
  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const counts: Record<string, { label: string; count: number }> = {};
    parsedRows.forEach(r => {
      if (r.date) {
        const monthKey = r.date.substring(0, 7);
        if (!counts[monthKey]) {
          const d = new Date(r.date + 'T00:00:00');
          const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          counts[monthKey] = { label, count: 0 };
        }
        counts[monthKey].count += 1;
      }
    });

    return Object.keys(counts)
      .sort()
      .map(k => counts[k]);
  }, [parsedRows]);

  // Detected duplicates
  const detectedDuplicates = useMemo(() => {
    return parsedRows.filter(r => {
      if (!r.isValid || !r.date || !r.amount) return false;
      const targetCat = categoryMappings[r.categoryName.trim()] || r.categoryName;
      const res = checkIsDuplicate(
        { date: r.date, amount: r.amount, categoryName: targetCat, description: r.description },
        existingUserTxs
      );
      return res.isDuplicate;
    });
  }, [parsedRows, categoryMappings, existingUserTxs]);

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidRows = parsedRows.filter(r => !r.isValid);
  const invalidCount = invalidRows.length;
  const readyToImportCount = parsedRows.filter(r => r.isValid && !skipDuplicatesMap[r.rowNumber]).length;

  const uniqueRawCategories = Array.from(new Set(parsedRows.map(r => r.categoryName.trim())));

  const handleSelectCatMapping = (rawCat: string, targetCat: string) => {
    onCategoryMappingChange(rawCat, targetCat);
    // Save user choice for future smart category resolution
    categoryMappingService.saveUserMapping(rawCat, targetCat);
  };

  // Result Summary Screen
  if (importResult) {
    return (
      <View style={styles.sectionCard}>
        <View style={styles.successHeader}>
          <CheckCircle2 size={48} color={Colors.success.DEFAULT} />
          <Text style={styles.successTitle}>Import Complete ✓</Text>
          <Text style={styles.successSub}>
            {importResult.importedCount} expenses imported
          </Text>
        </View>

        {/* Month breakdown list */}
        <View style={styles.resultBreakdownCard}>
          <Text style={styles.resultBreakdownHeader}>Imported Distribution by Month</Text>
          {Object.values(importResult.monthCounts).map(m => (
            <View key={`res-m-${m.label}`} style={styles.resultRow}>
              <Text style={styles.resultMonthText}>{m.label}</Text>
              <Text style={styles.resultCountText}>{m.count} expenses</Text>
            </View>
          ))}
        </View>

        {/* Skipped & Failed Summary */}
        <View style={styles.resultStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{importResult.skippedCount}</Text>
            <Text style={styles.statLabel}>Skipped (Duplicates)</Text>
          </View>
          <View style={[styles.statBox, importResult.failedCount > 0 && { backgroundColor: `${Colors.danger.DEFAULT}15` }]}>
            <Text style={[styles.statVal, importResult.failedCount > 0 && { color: Colors.danger.DEFAULT }]}>
              {importResult.failedCount}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        {/* Failed Rows Detail */}
        {importResult.failedCount > 0 && (
          <View style={styles.failedCard}>
            <View style={styles.failedHeaderGroup}>
              <XCircle size={18} color={Colors.danger.DEFAULT} />
              <Text style={styles.failedTitle}>Failed Rows ({importResult.failedCount})</Text>
            </View>
            {importResult.failedRows.map(f => (
              <View key={`failed-r-${f.rowNumber}`} style={styles.failedItem}>
                <Text style={styles.failedItemTitle}>Row {f.rowNumber}: {f.item.categoryName} ({formatCurrency(f.item.amount)})</Text>
                <Text style={styles.failedItemReason}>{f.errorReason}</Text>
              </View>
            ))}
          </View>
        )}

        <Button
          label="Done"
          onPress={onDone}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  // Preview Screen
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.previewMainHeading}>IMPORT EXPENSES</Text>
      <Text style={styles.previewSubHeading}>{parsedRows.length} expenses found</Text>

      {/* Monthly Distribution List */}
      {monthlyBreakdown.length > 0 && (
        <View style={styles.monthlyBreakdownCard}>
          <Text style={styles.breakdownHeaderTitle}>Monthly Breakdown</Text>
          <View style={styles.breakdownList}>
            {monthlyBreakdown.map(item => (
              <View key={`month-${item.label}`} style={styles.breakdownRow}>
                <Text style={styles.breakdownMonthLabel}>{item.label}</Text>
                <Text style={styles.breakdownMonthCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Status Summary Bar */}
      <View style={styles.previewSummaryBar}>
        <View style={[styles.summaryBadge, { backgroundColor: `${Colors.success.DEFAULT}15` }]}>
          <Text style={[styles.summaryBadgeVal, { color: Colors.success.DEFAULT }]}>✓ {readyToImportCount}</Text>
          <Text style={styles.summaryBadgeLabel}>ready to import</Text>
        </View>
        {invalidCount > 0 && (
          <View style={[styles.summaryBadge, { backgroundColor: `${Colors.danger.DEFAULT}15` }]}>
            <Text style={[styles.summaryBadgeVal, { color: Colors.danger.DEFAULT }]}>⚠ {invalidCount}</Text>
            <Text style={styles.summaryBadgeLabel}>require attention</Text>
          </View>
        )}
      </View>

      {/* DUPLICATE DETECTION CARD */}
      {detectedDuplicates.length > 0 && (
        <View style={styles.duplicateCard}>
          <View style={styles.duplicateHeaderGroup}>
            <Copy size={18} color={Colors.primary.DEFAULT} />
            <Text style={styles.duplicateTitle}>Possible Duplicates Detected ({detectedDuplicates.length})</Text>
          </View>
          <Text style={styles.duplicateSub}>
            Existing transactions match the date, amount, and category.
          </Text>

          {detectedDuplicates.map(dupRow => {
            const isSkipped = !!skipDuplicatesMap[dupRow.rowNumber];
            const formattedDate = dupRow.date
              ? new Date(dupRow.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : dupRow.rawDate;

            return (
              <View key={`dup-row-${dupRow.rowNumber}`} style={styles.duplicateItem}>
                <View style={styles.dupInfoGroup}>
                  <Text style={styles.dupBadgeTitle}>Possible duplicate</Text>
                  <Text style={styles.dupMetaText}>{formattedDate}</Text>
                  <Text style={styles.dupMetaText}>{dupRow.categoryName} • {formatCurrency(dupRow.amount || 0)}</Text>
                  <Text style={styles.dupReason}>Existing transaction found.</Text>
                </View>

                <View style={styles.dupActionRow}>
                  <TouchableOpacity
                    style={[styles.dupBtn, isSkipped && styles.dupBtnActive]}
                    onPress={() => onToggleSkipDuplicate(dupRow.rowNumber)}
                  >
                    <Text style={[styles.dupBtnText, isSkipped && styles.dupBtnTextActive]}>
                      {isSkipped ? '✓ Skip Duplicate' : 'Skip Duplicate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dupBtn, !isSkipped && styles.dupBtnActiveSecondary]}
                    onPress={() => onToggleSkipDuplicate(dupRow.rowNumber)}
                  >
                    <Text style={[styles.dupBtnText, !isSkipped && styles.dupBtnTextActiveSecondary]}>
                      Import anyway
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* CATEGORY MATCHING & RESOLUTION SECTION */}
      <View style={styles.catMatchingBox}>
        <View style={styles.catMatchingHeaderGroup}>
          <Sparkles size={18} color={Colors.primary.DEFAULT} />
          <Text style={styles.catMatchingTitle}>Category Assignment & Mapping</Text>
        </View>
        <Text style={styles.catMatchingSub}>
          Resolved categories based on explicit CSV values, description matching, and your custom preferences.
        </Text>

        {uniqueRawCategories.map(rawCat => {
          const matchRes = matchCategoryName(rawCat, userCategoryNames);
          const currentMapped = categoryMappings[rawCat] || rawCat;
          const isExplicit = parsedRows.some(r => r.categoryName === rawCat && r.isCategoryExplicit);

          return (
            <View key={`cat-map-${rawCat}`} style={styles.catMapRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rawCatText}>Item/Category: "{rawCat}"</Text>
                {isExplicit ? (
                  <Text style={styles.exactMatchText}>✓ Explicit category provided: "{rawCat}"</Text>
                ) : matchRes.confidence === 'exact' ? (
                  <Text style={styles.exactMatchText}>✓ Matched to "{matchRes.matchedName}"</Text>
                ) : matchRes.confidence === 'suggested' ? (
                  <Text style={styles.suggestedMatchText}>💡 Auto-resolved: "{matchRes.matchedName}"</Text>
                ) : (
                  <Text style={styles.newCatText}>⚠ Choose category below</Text>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catOptionScroll}>
                {userCategoryNames.map(existCat => (
                  <TouchableOpacity
                    key={`select-${rawCat}-${existCat}`}
                    style={[
                      styles.catChip,
                      currentMapped === existCat && styles.catChipActive
                    ]}
                    onPress={() => handleSelectCatMapping(rawCat, existCat)}
                  >
                    <Text style={[
                      styles.catChipText,
                      currentMapped === existCat && styles.catChipTextActive
                    ]}>
                      {currentMapped === existCat ? `✓ ${existCat}` : existCat}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.catChip,
                    currentMapped === rawCat && styles.catChipActive
                  ]}
                  onPress={() => handleSelectCatMapping(rawCat, rawCat)}
                >
                  <Text style={[
                    styles.catChipText,
                    currentMapped === rawCat && styles.catChipTextActive
                  ]}>
                    + "{rawCat}"
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          );
        })}
      </View>

      {/* Attention Needed Section */}
      {invalidCount > 0 && (
        <View style={styles.attentionCard}>
          <View style={styles.attentionHeaderGroup}>
            <AlertTriangle size={18} color={Colors.danger.DEFAULT} />
            <Text style={styles.attentionTitle}>Rows Needing Attention ({invalidCount})</Text>
          </View>
          {invalidRows.map((invRow) => (
            <View key={`attention-row-${invRow.rowNumber}`} style={styles.attentionItem}>
              <Text style={styles.attentionRowTitle}>Row {invRow.rowNumber}</Text>
              <Text style={styles.attentionReason}>{invRow.errorReason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Mobile-Responsive Row Cards */}
      <Text style={styles.tableHeaderTitle}>Expense Rows Preview ({parsedRows.length})</Text>
      <View style={styles.cardListContainer}>
        {parsedRows.map(row => (
          <ExpenseImportRow
            key={`row-card-${row.rowNumber}`}
            row={row}
            mappedCategory={categoryMappings[row.categoryName.trim()] || row.categoryName}
            isSkipped={!!skipDuplicatesMap[row.rowNumber]}
          />
        ))}
      </View>

      {/* Primary Actions */}
      <View style={styles.btnRow}>
        <Button
          label="Back / Select File"
          onPress={onBack}
          variant="outline"
          size="lg"
          style={{ flex: 1 }}
        />
        <Button
          label={`Import ${readyToImportCount} Expenses`}
          onPress={onConfirmImport}
          variant="primary"
          size="lg"
          style={{ flex: 1.5 }}
          disabled={readyToImportCount === 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    gap: 16,
    ...Theme.shadows.sm,
  },
  previewMainHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  previewSubHeading: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: -8,
  },
  monthlyBreakdownCard: {
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    gap: 8,
  },
  breakdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  breakdownList: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  breakdownMonthLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  breakdownMonthCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  previewSummaryBar: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryBadge: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 12,
    alignItems: 'center',
  },
  summaryBadgeVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryBadgeLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  duplicateCard: {
    backgroundColor: `${Colors.primary.DEFAULT}08`,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary.DEFAULT}30`,
    padding: 14,
    gap: 10,
  },
  duplicateHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  duplicateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  duplicateSub: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -4,
    lineHeight: 16,
  },
  duplicateItem: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  dupInfoGroup: {
    gap: 2,
  },
  dupBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    textTransform: 'uppercase',
  },
  dupMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dupReason: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  dupActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dupBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Theme.radius.sm,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
  },
  dupBtnActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  dupBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  dupBtnTextActive: {
    color: Colors.white,
  },
  dupBtnActiveSecondary: {
    backgroundColor: `${Colors.primary.DEFAULT}20`,
    borderColor: Colors.primary.DEFAULT,
  },
  dupBtnTextActiveSecondary: {
    color: Colors.primary.DEFAULT,
  },
  catMatchingBox: {
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  catMatchingHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catMatchingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  catMatchingSub: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -4,
    lineHeight: 16,
  },
  catMapRow: {
    backgroundColor: Colors.surface.DEFAULT,
    padding: 10,
    borderRadius: Theme.radius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  rawCatText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  exactMatchText: {
    fontSize: 11,
    color: Colors.success.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  suggestedMatchText: {
    fontSize: 11,
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  newCatText: {
    fontSize: 11,
    color: Colors.warning.DEFAULT,
    fontWeight: '700',
    marginTop: 2,
  },
  catOptionScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  catChipActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  catChipTextActive: {
    color: Colors.white,
  },
  attentionCard: {
    backgroundColor: `${Colors.danger.DEFAULT}10`,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
    padding: 14,
    gap: 10,
  },
  attentionHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
  },
  attentionItem: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}20`,
  },
  attentionRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  attentionReason: {
    fontSize: 12,
    color: Colors.danger.DEFAULT,
    marginTop: 2,
  },
  tableHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 4,
  },
  cardListContainer: {
    gap: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  // Result step styles
  successHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  successSub: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success.DEFAULT,
  },
  resultBreakdownCard: {
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  resultBreakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  resultMonthText: {
    fontSize: 13,
    color: Colors.text.primary,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  failedCard: {
    backgroundColor: `${Colors.danger.DEFAULT}10`,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
    padding: 14,
    gap: 8,
  },
  failedHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  failedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
  },
  failedItem: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    padding: 8,
  },
  failedItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  failedItemReason: {
    fontSize: 11,
    color: Colors.danger.DEFAULT,
    marginTop: 2,
  },
});
