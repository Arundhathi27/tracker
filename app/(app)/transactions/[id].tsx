import React, { useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { CategorySelect } from '@/components/budget/CategorySelect';
import { PaymentMethodSelect } from '@/components/transactions/PaymentMethodSelect';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Trash2 } from 'lucide-react-native';
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

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading: isFetching } = useTransaction(id);
  const { mutateAsync: updateTransaction } = useUpdateTransaction();
  const { mutateAsync: deleteTransaction } = useDeleteTransaction();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      date: toISODate(new Date()),
      category_id: '',
      payment_method_id: '',
    },
  });

  const [error, setError] = React.useState<string | null>(null);
  const txDate = watch('date');

  useEffect(() => {
    if (transaction) {
      reset({
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        date: transaction.date,
        category_id: transaction.category_id || '',
        payment_method_id: transaction.payment_method_id || '',
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: ExpenseFormValues) => {
    setError(null);
    


    try {
      await updateTransaction({
        id,
        dto: {
          amount: Number(data.amount),
          description: data.description || 'Expense',
          date: data.date,
          category_id: data.category_id,
          payment_method_id: data.payment_method_id || null,
        },
      });
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
            router.back();
          } catch (error) {}
        }
      }
    ]);
  };

  if (isFetching) {
    return (
      <View style={styles.container}>
        <Header showBack title="Edit Expense" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Edit Expense"
        rightElement={
          <Button
            label=""
            variant="ghost"
            onPress={handleDelete}
            leftIcon={<Trash2 size={24} color={Colors.danger.DEFAULT} />}
            style={styles.deleteButton}
          />
        }
      />

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
              label={isSubmitting ? 'Saving...' : 'Save Changes'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
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
