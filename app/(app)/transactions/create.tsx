import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { CategorySelect } from '@/components/budget/CategorySelect';
import { PaymentMethodSelect } from '@/components/transactions/PaymentMethodSelect';
import { budgetService } from '@/services/budgetService';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { toISODate } from '@/utils/date';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Must be a valid positive number' }
  ),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  category_id: z.string().min(1, 'Category is required'),
  payment_method_id: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function CreateExpenseScreen() {
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      date: toISODate(new Date()), // YYYY-MM-DD
      category_id: '',
      payment_method_id: '',
    },
  });

  const txDate = watch('date');
  
  const onSubmit = async (data: ExpenseFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      let finalCatId: string | null = data.category_id || null;

      // If category_id is a synthetic std- ID, attempt matching against existing user categories
      if (finalCatId && (finalCatId.startsWith('std-') || !finalCatId.includes('-'))) {
        const catName = finalCatId.replace('std-', '');
        try {
          const allBudgets = await budgetService.getMonthlyBudgets();
          let foundId: string | null = null;
          for (const mb of allBudgets) {
            if (mb.budget_categories) {
              const match = mb.budget_categories.find(c => c.name.toLowerCase().trim() === catName.toLowerCase().trim());
              if (match) {
                foundId = match.id;
                break;
              }
            }
          }
          finalCatId = foundId;
        } catch {
          finalCatId = null;
        }
      }

      await createTransaction({
        type: 'expense',
        amount: Number(data.amount),
        description: data.description || 'Expense',
        date: data.date,
        category_id: finalCatId,
        payment_method_id: data.payment_method_id || null,
      });

      setIsSubmitting(false);
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Add Expense" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Input
                    label="Amount"
                    placeholder="0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.amount?.message}
                    keyboardType="decimal-pad"
                    leftIcon={<Text style={styles.currencySymbol}>₹</Text>}
                    isRequired
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="category_id"
              render={({ field: { onChange, value } }) => (
                <CategorySelect 
                  value={value} 
                  onChange={onChange} 
                  error={errors.category_id?.message} 
                  transactionDate={txDate}
                />
              )}
            />

            <Controller
              control={control}
              name="payment_method_id"
              render={({ field: { onChange, value } }) => (
                <PaymentMethodSelect 
                  value={value} 
                  onChange={onChange} 
                  error={errors.payment_method_id?.message} 
                />
              )}
            />

            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Input
                    label="Date (YYYY-MM-DD)"
                    placeholder="YYYY-MM-DD"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.date?.message}
                    isRequired
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Input
                    label="Note (Optional)"
                    placeholder="Add a note..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.submitContainer}>
            <Button
              label={isSubmitting ? 'Saving...' : 'Save Expense'}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    padding: 16,
    borderRadius: Theme.radius.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    gap: 24,
    backgroundColor: Colors.surface.DEFAULT,
    padding: 24,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  inputGroup: {
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: 32,
  },
});
