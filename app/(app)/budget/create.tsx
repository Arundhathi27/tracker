import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateMonthlyBudget, useMonthlyBudgets } from '@/hooks/useBudgets';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { toISOMonth } from '@/utils/date';
import { formatCurrency } from '@/utils/formatters';

const monthlyBudgetSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  total_amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Amount must be a positive number' }
  ),
});

type MonthlyBudgetFormValues = z.infer<typeof monthlyBudgetSchema>;

// Generate next 12 months for dropdown
const generateMonths = () => {
  const months = [];
  const date = new Date();
  for (let i = 0; i < 12; i++) {
  const month = toISOMonth(date); // YYYY-MM
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    months.push({ label, value: month });
    date.setMonth(date.getMonth() + 1);
  }
  return months;
};

const MONTHS = generateMonths();

export default function CreateMonthlyBudgetScreen() {
  const { data: existingBudgets } = useMonthlyBudgets();
  const { mutateAsync: createMonthlyBudget } = useCreateMonthlyBudget();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingMonths = existingBudgets?.map(b => b.month) || [];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MonthlyBudgetFormValues>({
    resolver: zodResolver(monthlyBudgetSchema),
    defaultValues: {
      month: MONTHS[0].value,
      total_amount: '',
    },
  });

  const selectedMonth = watch('month');

  const onSubmit = async (data: MonthlyBudgetFormValues) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const budget = await createMonthlyBudget({
        month: data.month,
        total_amount: Number(data.total_amount),
      });
      // Navigate to details page to add categories
      router.replace(`/(app)/budget/${budget.id}` as any);
    } catch (err: any) {
      setError(err.message || 'Failed to create monthly budget');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="New Monthly Budget" />
      
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Month</Text>
              <View style={styles.monthContainer}>
                {MONTHS.slice(0, 4).map((m) => {
                  const isExisting = existingMonths.includes(m.value);
                  return (
                    <Button
                      key={m.value}
                      label={m.label.split(' ')[0]} // Just the month name
                      onPress={() => {
                        if (isExisting) {
                          const existingId = existingBudgets?.find(b => b.month === m.value)?.id;
                          if (existingId) router.replace(`/(app)/budget/${existingId}` as any);
                        } else {
                          setValue('month', m.value);
                        }
                      }}
                      variant={selectedMonth === m.value ? 'primary' : (isExisting ? 'ghost' : 'outline')}
                      size="sm"
                      style={[styles.monthButton, isExisting && { opacity: 0.5 }]}
                    />
                  );
                })}
              </View>
            </View>

            <Controller
              control={control}
              name="total_amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Input
                    label="Total Monthly Budget"
                    placeholder="0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.total_amount?.message}
                    keyboardType="decimal-pad"
                    leftIcon={<Text style={styles.currencySymbol}>₹</Text>}
                    isRequired
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.infoContainer}>
             <Text style={styles.infoText}>
                After creating your monthly budget, you can allocate limits to specific categories like Groceries, Rent, and Transport.
             </Text>
          </View>

          <View style={styles.submitContainer}>
            <Button
              label={isSubmitting ? 'Creating...' : 'Create Budget'}
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
    padding: 20,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 4,
  },
  currencySymbol: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  monthContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthButton: {
    flex: 1,
    minWidth: '45%',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: `${Colors.primary.DEFAULT}10`,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary.DEFAULT}30`,
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: 24,
  },
});
