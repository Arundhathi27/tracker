import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Plus, ChevronRight, PieChart } from 'lucide-react-native';
import { useMonthlyBudgets } from '@/hooks/useBudgets';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { MonthlyBudget } from '@/types';

function MonthlyBudgetCard({ budget, onPress }: { budget: MonthlyBudget; onPress: (b: MonthlyBudget) => void }) {
  const spent = budget.budget_categories?.reduce((acc, cat) => acc + cat.spent, 0) || 0;
  const progress = Math.min(spent / budget.total_amount, 1) * 100;
  
  return (
    <Pressable style={styles.card} onPress={() => onPress(budget)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{budget.month}</Text>
        <ChevronRight size={20} color={Colors.text.tertiary} />
      </View>
      
      <Text style={styles.amount}>{formatCurrency(budget.total_amount)}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%` },
              progress > 90 ? { backgroundColor: Colors.danger.DEFAULT } : {}
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{formatCurrency(spent)} spent</Text>
          <Text style={styles.progressLabel}>{formatCurrency(budget.total_amount - spent)} left</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function BudgetsOverviewScreen() {
  const { data: budgets, isLoading } = useMonthlyBudgets();

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <PieChart size={48} color={Colors.text.tertiary} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>No budget has been created yet.</Text>
        <Text style={styles.emptySubtitle}>
          Create a monthly budget to track your spending limits.
        </Text>
        <Button
          label="Create Budget"
          onPress={() => router.push('/(app)/budget/create' as any)}
          variant="primary"
          leftIcon={<Plus size={20} color={Colors.white} />}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Budgets" />
      <View style={styles.content}>
        <FlatList
          data={budgets || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MonthlyBudgetCard 
              budget={item} 
              onPress={(b: MonthlyBudget) => router.push(`/(app)/budget/${b.id}` as any)} 
            />
          )}
          ListEmptyComponent={renderEmptyComponent}
        />

        {budgets && budgets.length > 0 && (
          <View style={styles.fabContainer}>
            <Button
              label="New Monthly Budget"
              onPress={() => router.push('/(app)/budget/create' as any)}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Plus size={24} color={Colors.white} />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100, // Space for FAB
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
    backgroundColor: Colors.surface.DEFAULT,
    paddingVertical: 40,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  summaryCard: {
    backgroundColor: Colors.primary.DEFAULT,
    marginHorizontal: 20,
    marginTop: 56,
    borderRadius: Theme.radius['2xl'],
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    padding: 20,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border.DEFAULT,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
