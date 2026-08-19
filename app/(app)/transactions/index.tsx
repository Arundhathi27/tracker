import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Pressable, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle, Trash2, Edit2, Filter, ArrowDownUp,
  CreditCard, Banknote, Wallet, Landmark, Calendar as CalendarIcon, FileSpreadsheet,
  CheckCircle2, Circle, CheckSquare, Square, X
} from 'lucide-react-native';
import { useTransactions, useDeleteTransaction, useDeleteTransactionsBatch } from '@/hooks/useTransactions';
import { useBudgetCategories, useMonthlyBudgetByMonth } from '@/hooks/useBudgets';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toISOMonth } from '@/utils/date';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils,
  Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle
};

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('upi') || lower.includes('phone') || lower.includes('mobile')) return Smartphone;
  if (lower.includes('cash')) return Banknote;
  if (lower.includes('card') || lower.includes('debit') || lower.includes('credit')) return CreditCard;
  if (lower.includes('bank') || lower.includes('net')) return Landmark;
  if (lower.includes('wallet')) return Wallet;
  return HelpCircle;
};

// Generates array of {label, value} for the past 12 months
function generateMonthOptions() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = toISOMonth(d); // YYYY-MM
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    months.push({ label, value });
  }
  return months;
}

function ExpenseRow({
  transaction,
  isSelectMode,
  isSelected,
  onPressRow,
  onLongPressRow,
  onEdit,
  onDelete
}: {
  transaction: Transaction;
  isSelectMode: boolean;
  isSelected: boolean;
  onPressRow: (t: Transaction) => void;
  onLongPressRow: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  const { category, description, amount, date, payment_method } = transaction;
  const iconName = category?.icon || 'HelpCircle';
  const iconColor = category?.color || Colors.primary.DEFAULT;
  const IconComp = ICON_MAP[iconName] || HelpCircle;
  const txDate = new Date(date + 'T00:00:00');
  const formattedDate = txDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Pressable
      style={[
        styles.expenseRow,
        isSelected && styles.expenseRowSelected
      ]}
      onPress={() => onPressRow(transaction)}
      onLongPress={() => onLongPressRow(transaction)}
      delayLongPress={250}
    >
      {/* Checkbox indicator in selection mode */}
      {isSelectMode && (
        <View style={styles.selectionCheckboxWrapper}>
          {isSelected ? (
            <CheckCircle2 size={22} color={Colors.primary.DEFAULT} />
          ) : (
            <Circle size={22} color={Colors.text.tertiary} />
          )}
        </View>
      )}

      <View style={[styles.rowIconWrapper, { backgroundColor: `${iconColor}20` }]}>
        <IconComp size={22} color={iconColor} />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowCategoryHeader}>
          <Text style={styles.rowCategoryName} numberOfLines={1}>{category?.name || 'Uncategorized'}</Text>
          {payment_method && payment_method.name && (
            <View style={styles.paymentBadge}>
              {React.createElement(getPaymentIcon(payment_method.name), { size: 10, color: Colors.text.secondary })}
              <Text style={styles.paymentBadgeText}>{payment_method.name}</Text>
            </View>
          )}
        </View>
        {!!description && description !== 'Expense' && (
          <Text style={styles.rowNote} numberOfLines={1}>{description}</Text>
        )}
        <Text style={styles.rowDate}>{formattedDate}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>-{formatCurrency(amount)}</Text>
        {!isSelectMode && (
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.actionBtn}>
              <Edit2 size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(transaction)} style={styles.actionBtn}>
              <Trash2 size={16} color={Colors.danger.DEFAULT} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  );
}

type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function ExpensesOverviewScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // 0 = current month
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  const monthOptions = React.useMemo(() => generateMonthOptions(), []);

  const selectedMonth = monthOptions[selectedMonthIndex];
  const dateStart = `${selectedMonth.value}-01`;
  const lastDay = new Date(
    parseInt(selectedMonth.value.slice(0, 4)),
    parseInt(selectedMonth.value.slice(5, 7)),
    0
  ).getDate();
  const dateEnd = `${selectedMonth.value}-${String(lastDay).padStart(2, '0')}`;

  const { data: budget } = useMonthlyBudgetByMonth(selectedMonth.value);
  const { data: categories } = useBudgetCategories(budget?.id || '');
  const { data: paymentMethods } = usePaymentMethods();

  const { data: transactions, isLoading, refetch } = useTransactions({
    type: 'expense',
    dateStart,
    dateEnd,
  });

  const { mutateAsync: deleteSingleTransaction } = useDeleteTransaction();
  const { mutateAsync: deleteBatchTransactions, isPending: isDeletingBatch } = useDeleteTransactionsBatch();

  // Client-side realtime search, filtering, and sorting
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = [...transactions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.category?.name && tx.category.name.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q)
      );
    }

    // Category filter
    if (selectedCategoryId) {
      result = result.filter(tx => tx.category_id === selectedCategoryId);
    }

    // Payment method filter
    if (selectedPaymentId) {
      result = result.filter(tx => tx.payment_method_id === selectedPaymentId);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, selectedCategoryId, selectedPaymentId, sortBy]);

  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Multi-select actions
  const handleToggleSelectTx = (tx: Transaction) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(tx.id)) {
        next.delete(tx.id);
      } else {
        next.add(tx.id);
      }
      if (next.size === 0) {
        setIsSelectMode(false);
      }
      return next;
    });
  };

  const handleRowPress = (tx: Transaction) => {
    if (isSelectMode) {
      handleToggleSelectTx(tx);
    } else {
      router.push(`/(app)/transactions/${tx.id}` as any);
    }
  };

  const handleRowLongPress = (tx: Transaction) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedTxIds(new Set([tx.id]));
    } else {
      handleToggleSelectTx(tx);
    }
  };

  const handleSelectAll = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;
    const allFilteredIds = filteredTransactions.map(t => t.id);
    const areAllSelected = allFilteredIds.every(id => selectedTxIds.has(id));

    if (areAllSelected) {
      setSelectedTxIds(new Set());
      setIsSelectMode(false);
    } else {
      setSelectedTxIds(new Set(allFilteredIds));
      setIsSelectMode(true);
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedTxIds(new Set());
  };

  const handleConfirmBulkDelete = () => {
    const count = selectedTxIds.size;
    if (count === 0) return;

    Alert.alert(
      `Delete ${count} ${count === 1 ? 'expense' : 'expenses'}?`,
      'This will permanently delete the selected transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const idsArray = Array.from(selectedTxIds);
              await deleteBatchTransactions(idsArray);
              setSelectedTxIds(new Set());
              setIsSelectMode(false);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete selected expenses. Please try again.');
              refetch();
            }
          },
        },
      ]
    );
  };

  const handleEdit = (tx: Transaction) => {
    router.push(`/(app)/transactions/${tx.id}` as any);
  };

  const handleDeleteSingle = (tx: Transaction) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSingleTransaction(tx.id);
          } catch {}
        }
      }
    ]);
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      );
    }
    
    if (transactions && transactions.length > 0 && filteredTransactions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Search size={48} color={Colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No search results</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters or search term.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <ShoppingBag size={48} color={Colors.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No expenses</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first expense for {selectedMonth.label}.
        </Text>
      </View>
    );
  };

  const areAllFilteredSelected = filteredTransactions.length > 0 &&
    filteredTransactions.every(t => selectedTxIds.has(t.id));

  return (
    <View style={styles.container}>
      {/* Header switches to Select Mode Header when selecting */}
      {isSelectMode ? (
        <View style={styles.selectHeaderBar}>
          <TouchableOpacity onPress={handleCancelSelect} style={styles.headerBtn}>
            <X size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.selectHeaderTitle}>
            {selectedTxIds.size} {selectedTxIds.size === 1 ? 'expense' : 'expenses'} selected
          </Text>
          <TouchableOpacity onPress={handleSelectAll} style={styles.headerBtn}>
            <Text style={styles.selectAllText}>
              {areAllFilteredSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Header 
          title="Expenses" 
          rightElement={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {filteredTransactions.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setIsSelectMode(true);
                    setSelectedTxIds(new Set());
                  }}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary.DEFAULT }}>Select</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push('/(app)/transactions/import' as any)} style={{ padding: 4 }}>
                <FileSpreadsheet size={22} color={Colors.primary.DEFAULT} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(app)/calendar' as any)} style={{ padding: 4 }}>
                <CalendarIcon size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Import Expenses Banner Entry Point */}
      {!isSelectMode && (
        <View style={styles.importBannerWrapper}>
          <TouchableOpacity
            style={styles.importBannerCard}
            onPress={() => router.push('/(app)/transactions/import' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.importBannerIconWrap}>
              <FileSpreadsheet size={20} color={Colors.primary.DEFAULT} />
            </View>
            <View style={styles.importBannerBody}>
              <Text style={styles.importBannerTitle}>Import Expenses</Text>
              <Text style={styles.importBannerSub}>Add multiple expenses from a CSV or Excel file</Text>
            </View>
            <ChevronRight size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? Colors.primary.DEFAULT : Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters Section */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {/* Sort Filter */}
            <View style={styles.filterGroup}>
              <View style={styles.filterGroupHeader}>
                <ArrowDownUp size={14} color={Colors.text.secondary} />
                <Text style={styles.filterGroupTitle}>Sort By</Text>
              </View>
              {['newest', 'oldest', 'highest', 'lowest'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, sortBy === opt && styles.filterChipActive]}
                  onPress={() => setSortBy(opt as SortType)}
                >
                  <Text style={[styles.filterChipText, sortBy === opt && styles.filterChipTextActive]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter */}
            {categories && categories.length > 0 && (
              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <ShoppingBag size={14} color={Colors.text.secondary} />
                  <Text style={styles.filterGroupTitle}>Category</Text>
                </View>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text style={[styles.filterChipText, !selectedCategoryId && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, selectedCategoryId === cat.id && styles.filterChipActive]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={[styles.filterChipText, selectedCategoryId === cat.id && styles.filterChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Payment Method Filter */}
            {paymentMethods && paymentMethods.length > 0 && (
              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <Smartphone size={14} color={Colors.text.secondary} />
                  <Text style={styles.filterGroupTitle}>Payment</Text>
                </View>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedPaymentId && styles.filterChipActive]}
                  onPress={() => setSelectedPaymentId(null)}
                >
                  <Text style={[styles.filterChipText, !selectedPaymentId && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {paymentMethods.map((pm: any) => (
                  <TouchableOpacity
                    key={pm.id}
                    style={[styles.filterChip, selectedPaymentId === pm.id && styles.filterChipActive]}
                    onPress={() => setSelectedPaymentId(pm.id)}
                  >
                    <Text style={[styles.filterChipText, selectedPaymentId === pm.id && styles.filterChipTextActive]}>
                      {pm.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => setSelectedMonthIndex(i => Math.min(i + 1, monthOptions.length - 1))}
          style={styles.monthArrow}
          disabled={selectedMonthIndex === monthOptions.length - 1}
        >
          <ChevronLeft size={20} color={selectedMonthIndex === monthOptions.length - 1 ? Colors.text.tertiary : Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.monthLabelWrapper}>
          <Text style={styles.monthLabel}>{selectedMonth.label}</Text>
          <Text style={styles.monthTotal}>{formatCurrency(totalSpent)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setSelectedMonthIndex(i => Math.max(i - 1, 0))}
          style={styles.monthArrow}
          disabled={selectedMonthIndex === 0}
        >
          <ChevronRight size={20} color={selectedMonthIndex === 0 ? Colors.text.tertiary : Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Expense List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ExpenseRow
            transaction={item}
            isSelectMode={isSelectMode}
            isSelected={selectedTxIds.has(item.id)}
            onPressRow={handleRowPress}
            onLongPressRow={handleRowLongPress}
            onEdit={handleEdit}
            onDelete={handleDeleteSingle}
          />
        )}
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Bulk Delete Bottom Action Bar */}
      {isSelectMode ? (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity style={styles.bulkCancelBtn} onPress={handleCancelSelect}>
            <Text style={styles.bulkCancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <Button
            label={`Delete ${selectedTxIds.size > 0 ? `(${selectedTxIds.size})` : ''}`}
            onPress={handleConfirmBulkDelete}
            variant="primary"
            size="md"
            style={styles.bulkDeleteBtn}
            disabled={selectedTxIds.size === 0 || isDeletingBatch}
            isLoading={isDeletingBatch}
            leftIcon={<Trash2 size={18} color={Colors.white} />}
          />
        </View>
      ) : (
        /* Floating Add Button */
        <View style={styles.fabContainer}>
          <Pressable
            style={styles.fab}
            onPress={() => router.push('/(app)/transactions/create' as any)}
          >
            <Plus size={28} color={Colors.white} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  selectHeaderBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  headerBtn: {
    padding: 6,
  },
  selectHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.lg,
    backgroundColor: Colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleActive: {
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    borderColor: Colors.primary.DEFAULT,
  },
  filtersSection: {
    marginBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingRight: 40,
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
    paddingVertical: 6,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    marginBottom: 4,
  },
  monthArrow: {
    padding: 6,
  },
  monthLabelWrapper: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  monthTotal: {
    fontSize: 13,
    color: Colors.danger.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 110,
    flexGrow: 1,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  expenseRowSelected: {
    backgroundColor: `${Colors.primary.DEFAULT}10`,
  },
  selectionCheckboxWrapper: {
    marginRight: 12,
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
  rowCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  rowCategoryName: {
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
    color: Colors.danger.DEFAULT,
    marginBottom: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    backgroundColor: Colors.surface.DEFAULT,
    padding: 40,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  importBannerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  importBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 12,
    gap: 12,
    ...Theme.shadows.sm,
  },
  importBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importBannerBody: {
    flex: 1,
  },
  importBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  importBannerSub: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
    ...Theme.shadows.lg,
  },
  bulkCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius.lg,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  bulkCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bulkDeleteBtn: {
    backgroundColor: Colors.danger.DEFAULT,
    minWidth: 140,
  },
});
