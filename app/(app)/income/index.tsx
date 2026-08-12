import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Pressable, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Filter, ArrowDownUp, Banknote, Edit2, Trash2
} from 'lucide-react-native';
import { useIncomeList, useDeleteIncome } from '@/hooks/useIncome';
import { Header } from '@/components/ui/Header';
import { IncomeRow } from '@/components/income/IncomeRow';
import { INCOME_SOURCES } from '@/components/income/IncomeSourceSelect';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Income, IncomeSource } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toISOMonth } from '@/utils/date';

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

type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function IncomeListScreen() {
  const [monthOptions] = useState(() => generateMonthOptions());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const selectedMonth = monthOptions[selectedMonthIndex];

  // Derive dateStart/dateEnd for the selected month
  const { dateStart, dateEnd } = useMemo(() => {
    const [y, m] = selectedMonth.value.split('-');
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      dateStart: `${y}-${m}-01`,
      dateEnd: `${y}-${m}-${lastDay}`,
    };
  }, [selectedMonth.value]);

  const { data: incomeList, isLoading } = useIncomeList({
    dateStart,
    dateEnd,
  });

  const deleteIncome = useDeleteIncome();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Client-side realtime search, filtering, and sorting
  const filteredIncome = useMemo(() => {
    if (!incomeList) return [];
    
    let result = [...incomeList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inc => 
        (inc.description && inc.description.toLowerCase().includes(q)) ||
        inc.source.toLowerCase().includes(q) ||
        inc.amount.toString().includes(q)
      );
    }

    if (selectedSource) {
      result = result.filter(inc => inc.source === selectedSource);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [incomeList, searchQuery, selectedSource, sortBy]);

  const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      );
    }

    if (incomeList && incomeList.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Search size={32} color={Colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No search results</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters to find what you're looking for.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Banknote size={32} color={Colors.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No income</Text>
        <Text style={styles.emptySubtitle}>
          You haven't recorded any income for {selectedMonth.label}.
        </Text>
      </View>
    );
  };

  const handleEdit = (inc: Income) => {
    router.push(`/(app)/income/${inc.id}` as any);
  };

  const handleDelete = (inc: Income) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteIncome.mutate(inc.id)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Income" />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search income..."
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

            {/* Source Filter */}
            <View style={styles.filterGroup}>
              <View style={styles.filterGroupHeader}>
                <Banknote size={14} color={Colors.text.secondary} />
                <Text style={styles.filterGroupTitle}>Source</Text>
              </View>
              <TouchableOpacity
                style={[styles.filterChip, !selectedSource && styles.filterChipActive]}
                onPress={() => setSelectedSource(null)}
              >
                <Text style={[styles.filterChipText, !selectedSource && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {INCOME_SOURCES.map((src) => (
                <TouchableOpacity
                  key={src.id}
                  style={[styles.filterChip, selectedSource === src.id && styles.filterChipActive]}
                  onPress={() => setSelectedSource(src.id as IncomeSource)}
                >
                  <Text style={[styles.filterChipText, selectedSource === src.id && styles.filterChipTextActive]}>
                    {src.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
          <Text style={styles.monthTotal}>+{formatCurrency(totalIncome)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setSelectedMonthIndex(i => Math.max(i - 1, 0))}
          style={styles.monthArrow}
          disabled={selectedMonthIndex === 0}
        >
          <ChevronRight size={20} color={selectedMonthIndex === 0 ? Colors.text.tertiary : Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Income List */}
      <FlatList
        data={filteredIncome}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <IncomeRow income={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Floating Add Button */}
      <View style={styles.fabContainer}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(app)/income/create' as any)}
        >
          <Plus size={28} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
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
    color: Colors.success.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
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
    backgroundColor: Colors.success.DEFAULT, // Make it distinct from Expenses
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
