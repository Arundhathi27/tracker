import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useCreateSavingsGoal } from '@/hooks/useSavingsGoals';
import { z } from 'zod';

const goalSchema = z.object({
  title: z.string().min(1, 'Goal name is required'),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().min(0, 'Current saved amount cannot be negative'),
});

export default function CreateSavingsGoalScreen() {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createGoal = useCreateSavingsGoal();

  const handleSave = async () => {
    try {
      setErrors({});
      const parsedTarget = parseFloat(targetAmount) || 0;
      const parsedCurrent = parseFloat(currentAmount) || 0;
      
      goalSchema.parse({
        title,
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
      });
      
      let formattedDate: string | null = null;
      if (targetDate.trim()) {
        const parts = targetDate.trim().split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          if (isNaN(Date.parse(formattedDate))) {
            throw new z.ZodError([{ path: ['target_date'], message: 'Invalid date format (YYYY-MM-DD)', code: 'custom' }]);
          }
        } else {
          throw new z.ZodError([{ path: ['target_date'], message: 'Invalid date format (YYYY-MM-DD)', code: 'custom' }]);
        }
      }

      await createGoal.mutateAsync({
        title: title.trim(),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        target_date: formattedDate,
        notes: notes.trim() || null,
        status: parsedCurrent >= parsedTarget ? 'completed' : 'active',
      });

      router.back();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = (error as any).errors.reduce((acc: Record<string, string>, curr: any) => {
          if (curr.path[0]) {
            acc[curr.path[0].toString()] = curr.message;
          }
          return acc;
        }, {});
        setErrors(formattedErrors);
      } else {
        Alert.alert('Error', (error as Error).message || 'Failed to save goal.');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="New Savings Goal" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Goal Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Name *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vacation, Emergency Fund, Laptop"
              placeholderTextColor={Colors.text.tertiary}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount *</Text>
            <View style={styles.currencyInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.input, styles.currencyInput, errors.target_amount && styles.inputError]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
            {errors.target_amount && <Text style={styles.errorText}>{errors.target_amount}</Text>}
          </View>

          {/* Current Saved */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Saved Amount</Text>
            <View style={styles.currencyInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.input, styles.currencyInput, errors.current_amount && styles.inputError]}
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
            {errors.current_amount && <Text style={styles.errorText}>{errors.current_amount}</Text>}
          </View>

          {/* Target Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Date (Optional)</Text>
            <TextInput
              style={[styles.input, errors.target_date && styles.inputError]}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text.tertiary}
            />
            {errors.target_date && <Text style={styles.errorText}>{errors.target_date}</Text>}
            <Text style={styles.helpText}>Leave blank for open-ended goals.</Text>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any details or links..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button 
          label="Create Goal" 
          onPress={handleSave} 
          disabled={createGoal.isPending}
          isLoading={createGoal.isPending}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 24,
  },
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.DEFAULT,
  },
  inputError: {
    borderColor: Colors.danger.DEFAULT,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginTop: 2,
  },
  helpText: {
    color: Colors.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  currencyInput: {
    flex: 1,
    paddingLeft: 40,
  },
  textArea: {
    height: 100,
  },
  saveBtn: {
    marginTop: 8,
  },
});
