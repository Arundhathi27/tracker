import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { IncomeSourceSelect } from '@/components/income/IncomeSourceSelect';
import { useCreateIncome } from '@/hooks/useIncome';
import { IncomeSource } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { toISODate } from '@/utils/date';
import { z } from 'zod';

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  source: z.string().min(1, 'Please select an income source'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

export default function CreateIncomeScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<IncomeSource | null>(null);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createIncome = useCreateIncome();

  const resetForm = useCallback(() => {
    setAmount('');
    setDescription('');
    setSource(null);
    setDate(toISODate(new Date()));
    setErrors({});
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm])
  );

  const handleSave = async () => {
    try {
      const parsedAmount = parseFloat(amount.replace(/,/g, ''));
      
      incomeSchema.parse({
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        source: source || '',
        description: description.trim(),
        date: date.trim(),
      });

      setErrors({});

      await createIncome.mutateAsync({
        amount: parsedAmount,
        source: source!,
        description: description.trim(),
        date: date.trim() || toISODate(new Date()),
      });

      resetForm();
      router.back();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (error as z.ZodError<any>).issues.forEach((e: any) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
      } else {
        Alert.alert('Error', (error as Error).message || 'Failed to save income.');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Add Income" showBack />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={[styles.amountContainer, errors.amount ? styles.inputError : null]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
                maxLength={10}
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, errors.description ? styles.inputError : null]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., August Salary"
              placeholderTextColor={Colors.text.tertiary}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, errors.date ? styles.inputError : null]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text.tertiary}
            />
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Source Selection */}
          <IncomeSourceSelect
            selectedSource={source}
            onSelect={setSource}
            error={errors.source}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          label="Save Income" 
          onPress={handleSave} 
          isLoading={createIncome.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border.DEFAULT,
    paddingBottom: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text.primary,
    padding: 0,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Theme.radius.lg,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.danger.DEFAULT,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface.DEFAULT,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
});
