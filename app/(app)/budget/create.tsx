import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, CheckCircle2, Calendar } from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateMonthlyBudget, useMonthlyBudgets, useUpdateMonthlyBudget } from '@/hooks/useBudgets';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { toISOMonth } from '@/utils/date';

const monthlyBudgetSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  total_amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Amount must be a positive number' }
  ),
});

type MonthlyBudgetFormValues = z.infer<typeof monthlyBudgetSchema>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CreateMonthlyBudgetScreen() {
  const { data: existingBudgets } = useMonthlyBudgets();
  const { mutateAsync: createMonthlyBudget } = useCreateMonthlyBudget();
  const { mutateAsync: updateMonthlyBudget } = useUpdateMonthlyBudget();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map existing budget months
  const existingBudgetsMap = useMemo(() => {
    const map: Record<string, { id: string; total_amount: number }> = {};
    (existingBudgets || []).forEach(b => {
      if (b.month) {
        map[b.month] = { id: b.id, total_amount: b.total_amount };
      }
    });
    return map;
  }, [existingBudgets]);

  const currentMonthStr = toISOMonth(new Date()); // e.g. 2026-08

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MonthlyBudgetFormValues>({
    resolver: zodResolver(monthlyBudgetSchema),
    defaultValues: {
      month: currentMonthStr,
      total_amount: '',
    },
  });

  const selectedMonth = watch('month'); // YYYY-MM
  const existingBudget = existingBudgetsMap[selectedMonth];
  const isEditingExisting = !!existingBudget;

  // Sync year state when selectedMonth changes
  useEffect(() => {
    if (selectedMonth && selectedMonth.includes('-')) {
      const y = parseInt(selectedMonth.split('-')[0], 10);
      if (!isNaN(y) && y !== selectedYear) {
        setSelectedYear(y);
      }
    }
  }, [selectedMonth]);

  // Pre-fill total amount if existing budget selected
  useEffect(() => {
    if (existingBudget) {
      setValue('total_amount', String(existingBudget.total_amount));
    }
  }, [selectedMonth, existingBudget, setValue]);

  const handleSelectMonth = (monthIndex: number) => {
    const monthPad = String(monthIndex + 1).padStart(2, '0');
    const monthKey = `${selectedYear}-${monthPad}`;
    setValue('month', monthKey);

    if (existingBudgetsMap[monthKey]) {
      setValue('total_amount', String(existingBudgetsMap[monthKey].total_amount));
    } else {
      setValue('total_amount', '');
    }
  };

  const getMonthLabel = (monthKey: string) => {
    if (!monthKey || !monthKey.includes('-')) return '';
    const [yStr, mStr] = monthKey.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    return `${MONTH_NAMES[mIdx]} ${yStr}`;
  };

  const onSubmit = async (data: MonthlyBudgetFormValues) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      let targetId = existingBudget?.id;

      if (isEditingExisting && targetId) {
        await updateMonthlyBudget({
          id: targetId,
          dto: { total_amount: Number(data.total_amount) },
        });
      } else {
        const created = await createMonthlyBudget({
          month: data.month,
          total_amount: Number(data.total_amount),
        });
        targetId = created.id;
      }

      setIsSubmitting(false);
      // Navigate to budget details screen to configure/manage categories
      router.replace(`/(app)/budget/${targetId}` as any);
    } catch (err: any) {
      setError(err.message || 'Failed to save monthly budget');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title={isEditingExisting ? 'Edit Monthly Budget' : 'New Monthly Budget'} />
      
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
            {/* Year Selector */}
            <View style={styles.yearSelectorRow}>
              <TouchableOpacity 
                style={styles.yearArrowBtn}
                onPress={() => setSelectedYear(y => y - 1)}
              >
                <ChevronLeft size={20} color={Colors.text.primary} />
              </TouchableOpacity>

              <View style={styles.yearDisplay}>
                <Calendar size={16} color={Colors.primary.DEFAULT} />
                <Text style={styles.yearText}>{selectedYear}</Text>
              </View>

              <TouchableOpacity 
                style={styles.yearArrowBtn}
                onPress={() => setSelectedYear(y => y + 1)}
              >
                <ChevronRight size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* 12 Month Grid Chips */}
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const monthPad = String(idx + 1).padStart(2, '0');
                const mKey = `${selectedYear}-${monthPad}`;
                const isSelected = selectedMonth === mKey;
                const hasExisting = !!existingBudgetsMap[mKey];

                return (
                  <TouchableOpacity
                    key={mKey}
                    style={[
                      styles.monthChip,
                      isSelected && styles.monthChipSelected,
                      hasExisting && !isSelected && styles.monthChipHasBudget,
                    ]}
                    onPress={() => handleSelectMonth(idx)}
                  >
                    <Text style={[
                      styles.monthChipText,
                      isSelected && styles.monthChipTextSelected,
                      hasExisting && !isSelected && styles.monthChipTextHasBudget,
                    ]}>
                      {name.substring(0, 3)}
                    </Text>
                    {hasExisting && (
                      <View style={[styles.dotIndicator, isSelected && { backgroundColor: Colors.white }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Month Status Card */}
            <View style={[styles.statusCard, isEditingExisting ? styles.statusCardEdit : styles.statusCardNew]}>
              {isEditingExisting ? (
                <View style={styles.statusCardHeader}>
                  <CheckCircle2 size={18} color={Colors.success.DEFAULT} />
                  <Text style={styles.statusCardTitle}>
                    {getMonthLabel(selectedMonth)} Budget Exists
                  </Text>
                </View>
              ) : (
                <Text style={styles.statusCardTitleNew}>
                  Target Period: {getMonthLabel(selectedMonth)}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="total_amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Input
                    label={`Total Budget for ${getMonthLabel(selectedMonth)}`}
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
              {isEditingExisting
                ? `Editing total limit for ${getMonthLabel(selectedMonth)}. Next, you can adjust category allocations.`
                : `After setting the total budget for ${getMonthLabel(selectedMonth)}, you can allocate limits to specific categories like Groceries, Rent, and Transport.`}
            </Text>
          </View>

          <View style={styles.submitContainer}>
            <Button
              label={
                isSubmitting
                  ? 'Saving...'
                  : isEditingExisting
                  ? `Edit ${getMonthLabel(selectedMonth)} Budget`
                  : `Create ${getMonthLabel(selectedMonth)} Budget`
              }
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
    gap: 16,
    backgroundColor: Colors.surface.DEFAULT,
    padding: 20,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  yearArrowBtn: {
    padding: 8,
  },
  yearDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChip: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  monthChipSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  monthChipHasBudget: {
    borderColor: `${Colors.primary.DEFAULT}60`,
    backgroundColor: `${Colors.primary.DEFAULT}10`,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  monthChipTextSelected: {
    color: Colors.white,
    fontWeight: '800',
  },
  monthChipTextHasBudget: {
    color: Colors.primary.DEFAULT,
    fontWeight: '700',
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary.DEFAULT,
  },
  statusCard: {
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    marginVertical: 4,
  },
  statusCardEdit: {
    backgroundColor: `${Colors.success.DEFAULT}10`,
    borderColor: `${Colors.success.DEFAULT}30`,
  },
  statusCardNew: {
    backgroundColor: `${Colors.primary.DEFAULT}08`,
    borderColor: `${Colors.primary.DEFAULT}25`,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success.DEFAULT,
  },
  statusCardTitleNew: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  inputGroup: {
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 20,
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
    marginTop: 20,
  },
});
