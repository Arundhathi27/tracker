import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Trash2, Plus, Edit2, ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle } from 'lucide-react-native';
import { useMonthlyBudget, useUpdateMonthlyBudget, useDeleteMonthlyBudget, useBudgetCategories, useCreateBudgetCategory, useUpdateBudgetCategory, useDeleteBudgetCategory } from '@/hooks/useBudgets';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { CategoryModal } from '@/components/budget/CategoryModal';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { getBudgetStatus } from '@/utils/budgetStatus';
import { BudgetCategory } from '@/types';
import { EditBudgetModal } from '@/components/budget/EditBudgetModal';
import { ProgressBar } from '@/components/ui/ProgressBar';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle
};

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: budget, isLoading: isFetchingBudget } = useMonthlyBudget(id);
  const { data: categories, isLoading: isFetchingCategories } = useBudgetCategories(id);
  
  const { mutateAsync: deleteBudget } = useDeleteMonthlyBudget();
  const { mutateAsync: updateBudget } = useUpdateMonthlyBudget();
  const { mutateAsync: createCategory } = useCreateBudgetCategory();
  const { mutateAsync: updateCategory } = useUpdateBudgetCategory();
  const { mutateAsync: deleteCategory } = useDeleteBudgetCategory();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editBudgetVisible, setEditBudgetVisible] = useState(false);

  const handleDeleteBudget = () => {
    Alert.alert('Delete Budget', 'Are you sure you want to delete this monthly budget?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(id);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete budget');
          }
        }
      }
    ]);
  };

  const handleDeleteCategory = (catId: string) => {
    Alert.alert('Delete Category', 'Delete this category from your budget?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory({ id: catId, monthlyBudgetId: id });
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete category');
          }
        }
      }
    ]);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryModalVisible(true);
  };

  const handleOpenEdit = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async (data: { name: string; icon: string; color: string; allocated_amount: number }) => {
    if (editingCategory) {
      await updateCategory({
        id: editingCategory.id,
        monthlyBudgetId: id,
        dto: {
          name: data.name,
          icon: data.icon,
          color: data.color,
          allocated_amount: data.allocated_amount,
        },
      });
    } else {
      await createCategory({
        monthly_budget_id: id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        allocated_amount: data.allocated_amount,
      });
    }
  };

  if (isFetchingBudget) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Budget not found.</Text>
        <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const totalSpent = categories?.reduce((sum, cat) => sum + cat.spent_amount, 0) || 0;
  const mainStatus = getBudgetStatus(budget.total_amount, totalSpent);
  const progress = budget.total_amount > 0 ? Math.min(totalSpent / budget.total_amount, 1) : 0;
  const progressPct = Math.round((totalSpent / (budget.total_amount || 1)) * 100);

  const handleUpdateBudget = async (newAmount: number) => {
    await updateBudget({
      id: budget.id,
      dto: { total_amount: newAmount }
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header 
        showBack 
        title={`${budget.month} Budget`} 
        rightElement={
          <Button
            label=""
            variant="ghost"
            onPress={handleDeleteBudget}
            leftIcon={<Trash2 size={24} color={Colors.danger.DEFAULT} />}
            style={styles.deleteButton}
          />
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top: Budget Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Monthly Budget</Text>
            <Button
              label="Edit"
              variant="outline"
              size="sm"
              onPress={() => setEditBudgetVisible(true)}
              leftIcon={<Edit2 size={14} color={Colors.primary.DEFAULT} />}
            />
          </View>
          <Text style={styles.summaryAmount}>{formatCurrency(budget.total_amount)}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryVal, { color: Colors.danger.DEFAULT }]}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={[styles.summaryVal, { color: mainStatus.color }]}>{mainStatus.label}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabelText}>Budget Progress</Text>
              <Text style={[styles.progressPctText, mainStatus.status === 'over' ? { color: Colors.danger.DEFAULT } : {}]}>{progressPct}% Used</Text>
            </View>
            <ProgressBar progress={progress} color={mainStatus.status === 'over' ? Colors.danger.DEFAULT : Colors.primary.DEFAULT} />
          </View>
        </View>

        {/* Below: List of Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {isFetchingCategories ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{marginTop: 20}} />
          ) : categories?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories added yet.</Text>
            </View>
          ) : (
            categories?.map(cat => {
              const IconComp = ICON_MAP[cat.icon] || ShoppingBag;
              const catStatus = getBudgetStatus(cat.allocated_amount, cat.spent_amount);
              return (
                <Pressable key={cat.id} style={styles.categoryRow} onPress={() => handleOpenEdit(cat)}>
                  <View style={[styles.iconWrapper, { backgroundColor: `${cat.color}20` }]}>
                    <IconComp size={24} color={cat.color} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catAmount}>
                      {formatCurrency(cat.allocated_amount)} • <Text style={{ color: catStatus.color }}>{catStatus.label}</Text>
                    </Text>
                  </View>
                  <View style={styles.catActions}>
                    <Button
                      label=""
                      variant="ghost"
                      onPress={() => handleDeleteCategory(cat.id)}
                      leftIcon={<Trash2 size={20} color={Colors.text.tertiary} />}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating + Button */}
      <View style={styles.fabContainer}>
        <Button
          label="Add Category"
          onPress={handleOpenAdd}
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Plus size={24} color={Colors.white} />}
        />
      </View>

      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSave={handleSaveCategory}
        budget={budget}
        categories={categories || []}
        editingCategory={editingCategory}
      />

      <EditBudgetModal
        visible={editBudgetVisible}
        onClose={() => setEditBudgetVisible(false)}
        onSave={handleUpdateBudget}
        budget={budget}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100, // Space for FAB
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  deleteButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
  },
  summaryCard: {
    backgroundColor: Colors.surface.DEFAULT,
    padding: 24,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  summaryCol: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
    padding: 16,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  progressPctText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    padding: 16,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    marginBottom: 12,
    ...Theme.shadows.sm,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  catAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  catActions: {
    flexDirection: 'row',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
});
