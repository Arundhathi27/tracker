import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { SavingsGoal } from '@/types';
import { X } from 'lucide-react-native';

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (addedAmount: number) => Promise<void>;
  goal: SavingsGoal | null;
}

export function AddFundsModal({ visible, onClose, onSave, goal }: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
    }
  }, [visible]);

  const handleSave = async () => {
    setError('');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(parsedAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add funds');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Saved Amount</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.tertiary} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Enter the additional amount you have saved towards this goal.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount to Add</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              label="Add Funds"
              onPress={handleSave}
              isLoading={isSaving}
              variant="primary"
              fullWidth
              style={styles.saveButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius['2xl'],
    padding: 24,
    ...Theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.background.DEFAULT,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 8,
  },
});
