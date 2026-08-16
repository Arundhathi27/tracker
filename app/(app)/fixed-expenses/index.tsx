import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert, 
  RefreshControl,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Square, 
  Edit3, 
  Trash2, 
  Calendar,
  Layers,
  Sparkles,
  Info,
  X
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Header } from '@/components/ui/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { 
  useFixedExpenses, 
  useFixedExpenseOverrides, 
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
  useToggleFixedExpenseOverride
} from '@/hooks/useFixedExpenses';
import { useTransactions } from '@/hooks/useTransactions';
import type { FixedExpense, Transaction } from '@/types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const SUGGESTED_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Internet',
  'Utilities',
  'Groceries',
  'Phone Recharge',
  'Donation',
  'Subscription',
  'Maintenance',
  'Insurance',
  'Gas',
];

export default function FixedExpensesScreen() {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex + 1); // 1-12

  // In-Page Modal / Bottom Sheet state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FixedExpense | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategoryName, setFormCategoryName] = useState('');
  const [formKeyword, setFormKeyword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: fixedExpenses = [], isLoading: isLoadingExpenses, refetch: refetchExpenses } = useFixedExpenses();
  const { data: overrides = [], isLoading: isLoadingOverrides, refetch: refetchOverrides } = useFixedExpenseOverrides(selectedYear);
  
  // Fetch transactions for the selected year
  const yearStartDate = `${selectedYear}-01-01`;
  const yearEndDate = `${selectedYear}-12-31`;
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTx } = useTransactions({
    dateStart: yearStartDate,
    dateEnd: yearEndDate,
  });

  const createMutation = useCreateFixedExpense();
  const updateMutation = useUpdateFixedExpense();
  const deleteMutation = useDeleteFixedExpense();
  const toggleOverrideMutation = useToggleFixedExpenseOverride();

  const isRefreshing = isLoadingExpenses || isLoadingOverrides || isLoadingTransactions;

  const handleRefresh = () => {
    refetchExpenses();
    refetchOverrides();
    refetchTx();
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategoryName('');
    setFormKeyword('');
    setFormError(null);
    setModalVisible(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (fe: FixedExpense) => {
    setEditingItem(fe);
    setFormName(fe.name);
    setFormCategoryName(fe.category_name);
    setFormKeyword(fe.keyword || '');
    setFormError(null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setFormError(null);
  };

  // Submit Modal Form (Create or Edit)
  const handleSaveForm = async () => {
    if (!formName.trim()) {
      setFormError('Fixed expense name is required');
      return;
    }
    if (!formCategoryName.trim()) {
      setFormError('Category name is required');
      return;
    }

    setFormError(null);

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            name: formName,
            category_name: formCategoryName,
            keyword: formKeyword,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formName,
          category_name: formCategoryName,
          keyword: formKeyword,
        });
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save fixed expense');
    }
  };

  // Delete Fixed Expense Configuration (Does NOT touch transactions)
  const handleDeleteFixedExpense = (id: string, name: string) => {
    Alert.alert(
      'Delete Fixed Expense?',
      'This will remove this item from your Fixed Expenses checklist. Your existing expense transactions will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              if (modalVisible) {
                handleCloseModal();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete fixed expense');
            }
          },
        },
      ]
    );
  };

  // Map of matching transaction months per fixed expense
  const transactionMatches = useMemo(() => {
    const matches: Record<string, Record<number, boolean>> = {};

    fixedExpenses.forEach((fe) => {
      matches[fe.id] = {};
      for (let m = 1; m <= 12; m++) {
        const monthStr = m < 10 ? `0${m}` : `${m}`;
        const prefix = `${selectedYear}-${monthStr}`;

        const hasMatch = transactions.some((tx: Transaction) => {
          if (tx.type !== 'expense' || !tx.date.startsWith(prefix)) return false;

          const categoryName = tx.category?.name || '';
          const matchCategory = fe.category_name || '';
          const categoryMatches = categoryName.toLowerCase().trim() === matchCategory.toLowerCase().trim();

          if (!categoryMatches) return false;

          // If keyword is specified, description or category must contain keyword
          if (fe.keyword && fe.keyword.trim().length > 0) {
            const kw = fe.keyword.toLowerCase().trim();
            const desc = (tx.description || '').toLowerCase();
            const cat = categoryName.toLowerCase();
            return desc.includes(kw) || cat.includes(kw);
          }

          return true;
        });

        matches[fe.id][m] = hasMatch;
      }
    });

    return matches;
  }, [fixedExpenses, transactions, selectedYear]);

  // Set of manually overridden cells
  const overrideSet = useMemo(() => {
    const set = new Set<string>();
    overrides.forEach((ov) => {
      set.add(`${ov.fixed_expense_id}_${ov.month}`);
    });
    return set;
  }, [overrides]);

  // Handle Cell Press
  const handleCellPress = (fixedExpenseId: string, month: number, isTxMatched: boolean, isOverrideMatched: boolean) => {
    if (isTxMatched) {
      Alert.alert(
        'Transaction Recorded',
        `This month is marked as paid because an actual matching expense was recorded in ${MONTH_NAMES[month - 1]} ${selectedYear}.\n\nTo change this, edit or delete the transaction in the Activity screen.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Toggle manual override
    toggleOverrideMutation.mutate({
      fixedExpenseId,
      year: selectedYear,
      month,
    });
  };

  // Compute Summary Statistics
  const monthStats = useMemo(() => {
    if (fixedExpenses.length === 0) return { paid: 0, total: 0, percentage: 0 };

    let paidCount = 0;
    fixedExpenses.forEach((fe) => {
      const isTxMatched = transactionMatches[fe.id]?.[selectedMonth] || false;
      const isOverrideMatched = overrideSet.has(`${fe.id}_${selectedMonth}`);
      if (isTxMatched || isOverrideMatched) {
        paidCount++;
      }
    });

    const total = fixedExpenses.length;
    const percentage = total > 0 ? Math.round((paidCount / total) * 100) : 0;
    return { paid: paidCount, total, percentage };
  }, [fixedExpenses, transactionMatches, overrideSet, selectedMonth]);

  const yearStats = useMemo(() => {
    if (fixedExpenses.length === 0) return { paid: 0, total: 0, percentage: 0 };

    let paidCount = 0;
    const totalPossible = fixedExpenses.length * 12;

    fixedExpenses.forEach((fe) => {
      for (let m = 1; m <= 12; m++) {
        const isTxMatched = transactionMatches[fe.id]?.[m] || false;
        const isOverrideMatched = overrideSet.has(`${fe.id}_${m}`);
        if (isTxMatched || isOverrideMatched) {
          paidCount++;
        }
      }
    });

    const percentage = totalPossible > 0 ? Math.round((paidCount / totalPossible) * 100) : 0;
    return { paid: paidCount, total: totalPossible, percentage };
  }, [fixedExpenses, transactionMatches, overrideSet]);

  const isSubmittingModal = createMutation.isPending || updateMutation.isPending;

  if (isLoadingExpenses && !fixedExpenses.length) {
    return (
      <View style={styles.container}>
        <Header showBack title="Fixed Expenses" />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading fixed expenses...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack title="Fixed Expenses" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      >
        {/* Header Subtitle */}
        <View style={styles.topHeader}>
          <Text style={styles.subtitle}>Track regular payments</Text>
        </View>

        {/* Year Navigation Bar */}
        <View style={styles.yearNavContainer}>
          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={() => setSelectedYear(selectedYear - 1)}
            hitSlop={12}
          >
            <ChevronLeft size={20} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.yearDisplay}>
            <Calendar size={16} color={Colors.primary.DEFAULT} style={{ marginRight: 6 }} />
            <Text style={styles.yearText}>{selectedYear}</Text>
          </View>

          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={() => setSelectedYear(selectedYear + 1)}
            hitSlop={12}
          >
            <ChevronRight size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Text>
              <Text style={styles.summaryValue}>
                {monthStats.paid} / {monthStats.total} <Text style={styles.summarySub}>paid</Text>
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid this year ({selectedYear})</Text>
              <Text style={styles.summaryValue}>
                {yearStats.paid} / {yearStats.total} <Text style={styles.summarySub}>paid</Text>
              </Text>
            </View>
          </View>

          {/* Month Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthPillsContainer}
          >
            {MONTH_NAMES.map((mName, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              return (
                <TouchableOpacity
                  key={mName}
                  style={[styles.monthPill, isSelected && styles.monthPillActive]}
                  onPress={() => setSelectedMonth(mNum)}
                >
                  <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                    {mName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Matrix Section */}
        {fixedExpenses.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Layers size={36} color={Colors.primary.DEFAULT} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No Fixed Expenses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your regular household payments and we'll automatically mark them as paid when you record the expense.
            </Text>
          </View>
        ) : (
          <View style={styles.matrixContainer}>
            <View style={styles.matrixHeaderInfo}>
              <Sparkles size={14} color={Colors.primary.DEFAULT} style={{ marginRight: 6 }} />
              <Text style={styles.matrixHeaderText}>
                Tap item name to edit. Swipe left/right for months.
              </Text>
            </View>

            {/* Split Matrix Layout: Left Column Fixed, Right Table Horizontally Scrollable */}
            <View style={styles.matrixWrapper}>
              
              {/* Left Column: Expense Names */}
              <View style={styles.leftColumn}>
                {/* Top Corner Header Cell */}
                <View style={styles.leftHeaderCell}>
                  <Text style={styles.leftHeaderText}>Expense</Text>
                </View>

                {/* Expense Row Labels - Tapping row opens Edit Modal, icons trigger Edit / Delete */}
                {fixedExpenses.map((fe) => (
                  <TouchableOpacity 
                    key={fe.id} 
                    style={styles.leftRowCell}
                    onPress={() => handleOpenEditModal(fe)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, paddingRight: 2 }}>
                      <Text style={styles.expenseNameText} numberOfLines={1}>
                        {fe.name}
                      </Text>
                      <Text style={styles.categoryBadgeText} numberOfLines={1}>
                        {fe.category_name}
                      </Text>
                    </View>
                    <View style={styles.rowActionIcons}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditModal(fe)}
                        hitSlop={6}
                      >
                        <Edit3 size={13} color={Colors.text.tertiary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteFixedExpense(fe.id, fe.name)}
                        hitSlop={6}
                      >
                        <Trash2 size={13} color={Colors.danger.DEFAULT} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Right Columns: Horizontally Scrollable 12 Months */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.rightScrollView}>
                <View>
                  {/* Month Header Row */}
                  <View style={styles.monthsHeaderRow}>
                    {MONTH_NAMES.map((mName, idx) => {
                      const isCurrentM = selectedYear === currentYear && idx === currentMonthIndex;
                      return (
                        <View key={mName} style={[styles.monthHeaderCell, isCurrentM && styles.monthHeaderCellCurrent]}>
                          <Text style={[styles.monthHeaderText, isCurrentM && styles.monthHeaderTextCurrent]}>
                            {mName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Rows for each Fixed Expense */}
                  {fixedExpenses.map((fe) => (
                    <View key={fe.id} style={styles.matrixRow}>
                      {MONTH_NAMES.map((_, idx) => {
                        const mNum = idx + 1;
                        const isTxMatched = transactionMatches[fe.id]?.[mNum] || false;
                        const isOverrideMatched = overrideSet.has(`${fe.id}_${mNum}`);
                        const isPaid = isTxMatched || isOverrideMatched;

                        return (
                          <TouchableOpacity
                            key={mNum}
                            style={[
                              styles.matrixCell,
                              isPaid && styles.matrixCellPaid,
                              isTxMatched && styles.matrixCellAuto,
                            ]}
                            activeOpacity={0.7}
                            onPress={() => handleCellPress(fe.id, mNum, isTxMatched, isOverrideMatched)}
                          >
                            {isPaid ? (
                              <View style={styles.paidBadge}>
                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                              </View>
                            ) : (
                              <Square size={16} color={Colors.border.DEFAULT} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Help Note Footer */}
        <View style={styles.footerNote}>
          <Info size={13} color={Colors.text.tertiary} style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.footerNoteText}>
            ✓ Checkmarks are verified from actual expense transactions. Tap an empty cell to manually mark a payment without adding an expense.
          </Text>
        </View>
      </ScrollView>

      {/* ── FOOTER / BOTTOM ACTION BAR "+" ICON BUTTON FOR ADD FIXED EXPENSE ── */}
      <View style={styles.footerActionBar}>
        <TouchableOpacity
          style={styles.footerAddButton}
          onPress={handleOpenCreateModal}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.footerAddButtonText}>Add Fixed Expense</Text>
        </TouchableOpacity>
      </View>

      {/* ── IN-PAGE BOTTOM SHEET / MODAL FOR CREATE & EDIT ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} hitSlop={10}>
                <X size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
              {formError && (
                <View style={styles.modalErrorBanner}>
                  <Text style={styles.modalErrorText}>{formError}</Text>
                </View>
              )}

              {/* Expense Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fixed Expense Name *</Text>
                <Input
                  placeholder="Example: Rent, EB Bill, Internet"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              {/* Match Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Match Category Name *</Text>
                <Input
                  placeholder="Example: Rent, Electricity, Utilities"
                  value={formCategoryName}
                  onChangeText={setFormCategoryName}
                />
                <Text style={styles.suggestionTitle}>Category suggestions:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                  {SUGGESTED_CATEGORIES.map((cat) => {
                    const isSelected = formCategoryName.toLowerCase() === cat.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.pill, isSelected && styles.pillActive]}
                        onPress={() => {
                          setFormCategoryName(cat);
                          if (!formName) setFormName(cat);
                        }}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Optional Keyword */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Optional Matching Keyword</Text>
                <Input
                  placeholder="Example: house rent, EB, airtel"
                  value={formKeyword}
                  onChangeText={setFormKeyword}
                />
                <Text style={styles.helperText}>
                  If provided, the expense description must also contain this keyword.
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Button
                  label={isSubmittingModal ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Fixed Expense'}
                  onPress={handleSaveForm}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmittingModal}
                />

                {editingItem && (
                  <Button
                    label="Delete Fixed Expense"
                    onPress={() => handleDeleteFixedExpense(editingItem.id, editingItem.name)}
                    variant="danger"
                    size="lg"
                    fullWidth
                    disabled={isSubmittingModal}
                  />
                )}

                <Button
                  label="Cancel"
                  onPress={handleCloseModal}
                  variant="ghost"
                  size="md"
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  topHeader: {
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  yearNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  yearNavButton: {
    padding: 4,
  },
  yearDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border.DEFAULT,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summarySub: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  monthPillsContainer: {
    gap: 6,
    paddingTop: 2,
  },
  monthPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  monthPillActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  monthPillText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    marginVertical: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  matrixContainer: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
    marginBottom: 12,
  },
  matrixHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.DEFAULT}10`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  matrixHeaderText: {
    fontSize: 11,
    color: Colors.text.secondary,
    flex: 1,
  },
  matrixWrapper: {
    flexDirection: 'row',
  },
  leftColumn: {
    width: 124,
    borderRightWidth: 1,
    borderRightColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.DEFAULT,
    zIndex: 10,
  },
  leftHeaderCell: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    backgroundColor: `${Colors.background.DEFAULT}`,
  },
  leftHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  leftRowCell: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  expenseNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  rowActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 2,
  },
  rightScrollView: {
    flex: 1,
  },
  monthsHeaderRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    backgroundColor: Colors.background.DEFAULT,
  },
  monthHeaderCell: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border.DEFAULT,
  },
  monthHeaderCellCurrent: {
    backgroundColor: `${Colors.primary.DEFAULT}20`,
  },
  monthHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  monthHeaderTextCurrent: {
    color: Colors.primary.DEFAULT,
  },
  matrixRow: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  matrixCell: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border.DEFAULT,
  },
  matrixCellPaid: {
    backgroundColor: `${Colors.success.DEFAULT}08`,
  },
  matrixCellAuto: {
    backgroundColor: `${Colors.success.DEFAULT}18`,
  },
  paidBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  footerNoteText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    flex: 1,
    lineHeight: 15,
  },

  // Footer Action Bar
  footerActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface.DEFAULT,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
  footerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    gap: 8,
    ...Theme.shadows.sm,
  },
  footerAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.surface.DEFAULT,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalErrorBanner: {
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    padding: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  modalErrorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 13,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  suggestionTitle: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  pillsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.full,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  pillActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  pillText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    lineHeight: 15,
  },
  modalActions: {
    gap: 10,
    marginTop: 8,
  },
});
