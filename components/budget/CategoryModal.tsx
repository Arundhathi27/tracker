import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { ShoppingBag, Coffee, Car, Zap, Utensils, Smartphone, Heart, GraduationCap, PiggyBank, Briefcase, HelpCircle, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { BudgetCategory, MonthlyBudget } from '@/types';

type CategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; allocated_amount: number }) => Promise<void>;
  budget: MonthlyBudget;
  categories: BudgetCategory[];
  editingCategory?: BudgetCategory | null;
};

const AVAILABLE_ICONS = [
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Coffee', component: Coffee },
  { name: 'Car', component: Car },
  { name: 'Zap', component: Zap },
  { name: 'Utensils', component: Utensils },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Heart', component: Heart },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'PiggyBank', component: PiggyBank },
  { name: 'Briefcase', component: Briefcase },
  { name: 'HelpCircle', component: HelpCircle },
];

const AVAILABLE_COLORS = [
  '#6B4F3A', '#D8C3A5', '#C9A86A', '#4F8A5B', '#C65A5A', '#D4A373', '#8B622C', '#3D6C46'
];

export function CategoryModal({ visible, onClose, onSave, budget, categories, editingCategory }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setName(editingCategory.name);
        setAmount(editingCategory.allocated_amount.toString());
        setIcon(editingCategory.icon || 'ShoppingBag');
        setColor(editingCategory.color || AVAILABLE_COLORS[0]);
      } else {
        setName('');
        setAmount('');
        setIcon('ShoppingBag');
        setColor(AVAILABLE_COLORS[0]);
      }
    }
  }, [visible, editingCategory]);

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return;
    }

    // Check for duplicates
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && 
      cat.id !== editingCategory?.id
    );

    if (isDuplicate) {
      Alert.alert('Duplicate Category', 'A category with this name already exists in this budget.');
      return;
    }

    // Check for budget limit
    const totalOtherCategories = categories
      .filter(cat => cat.id !== editingCategory?.id)
      .reduce((sum, cat) => sum + cat.allocated_amount, 0);

    if (totalOtherCategories + parsedAmount > budget.total_amount) {
      Alert.alert('Budget Exceeded', 'The total allocated amount across all categories cannot exceed the monthly budget.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        icon,
        color,
        allocated_amount: parsedAmount
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Input
              label="Category Name"
              placeholder="e.g., Groceries"
              value={name}
              onChangeText={setName}
            />
            
            <View style={{ height: 16 }} />
            
            <Input
              label="Allocated Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              leftIcon={<Text style={styles.currencyIcon}>₹</Text>}
            />

            <View style={{ height: 24 }} />
            <Text style={styles.sectionLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.component;
                const isSelected = icon === item.name;
                return (
                  <Pressable
                    key={item.name}
                    style={[styles.iconItem, isSelected && styles.selectedIconItem, isSelected && { borderColor: color }]}
                    onPress={() => setIcon(item.name)}
                  >
                    <IconComp size={24} color={isSelected ? color : Colors.text.tertiary} />
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 24 }} />
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <Pressable
                    key={c}
                    style={[styles.colorItem, { backgroundColor: c }, isSelected && styles.selectedColorItem]}
                    onPress={() => setColor(c)}
                  />
                );
              })}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            />
            <Button
              label={isSubmitting ? 'Saving...' : 'Save Category'}
              variant="primary"
              onPress={handleSave}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface.DEFAULT,
    borderTopLeftRadius: Theme.radius['2xl'],
    borderTopRightRadius: Theme.radius['2xl'],
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    padding: 24,
  },
  currencyIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.DEFAULT,
  },
  selectedIconItem: {
    borderWidth: 2,
    backgroundColor: `${Colors.primary.DEFAULT}10`,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedColorItem: {
    borderWidth: 3,
    borderColor: Colors.surface.DEFAULT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.DEFAULT,
  },
});
