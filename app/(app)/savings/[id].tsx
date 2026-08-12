import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from '@/hooks/useSavingsGoals';
import { formatCurrency } from '@/utils/formatters';
import { Trash2, Edit2, Target, CheckCircle2 } from 'lucide-react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AddFundsModal } from '@/components/savings/AddFundsModal';

export default function SavingsGoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading, error } = useSavingsGoal(id);
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addFundsVisible, setAddFundsVisible] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.target_amount.toString());
      setCurrentAmount(goal.current_amount.toString());
      setTargetDate(goal.target_date ? goal.target_date : '');
      setNotes(goal.notes || '');
    }
  }, [goal]);

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this savings goal?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal.mutateAsync(id);
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete goal');
          }
        }
      }
    ]);
  };

  const handleSave = async () => {
    try {
      const parsedTarget = parseFloat(targetAmount) || 0;
      const parsedCurrent = parseFloat(currentAmount) || 0;
      
      let formattedDate: string | null = null;
      if (targetDate.trim()) {
        const parts = targetDate.trim().split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      await updateGoal.mutateAsync({
        id,
        title: title.trim(),
        target_amount: parsedTarget,
        current_amount: Math.max(0, parsedCurrent),
        target_date: formattedDate,
        notes: notes.trim() || null,
        status: parsedCurrent >= parsedTarget ? 'completed' : 'active',
      });

      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const handleUpdateFunds = async (addedAmount: number) => {
    if (!goal) return;
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        current_amount: goal.current_amount + addedAmount
      });
      setAddFundsVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add funds');
    }
  };

  const handleMarkCompleted = async () => {
    if (!goal) return;
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        current_amount: goal.target_amount,
        status: 'completed',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Goal Details" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </View>
    );
  }

  if (error || !goal) {
    return (
      <View style={styles.container}>
        <Header title="Goal Details" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>Goal not found.</Text>
        </View>
      </View>
    );
  }

  const isCompleted = goal.status === 'completed' || goal.current_amount >= goal.target_amount;
  const pct = goal.target_amount > 0 ? Math.min(1, Math.max(0, goal.current_amount / goal.target_amount)) : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  
  let daysRemaining = null;
  let isOverdue = false;
  if (goal.target_date && !isCompleted) {
    const targetDate = new Date(goal.target_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      isOverdue = true;
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header 
        title={isEditing ? "Edit Goal" : "Goal Details"} 
        showBack 
        rightElement={
          !isEditing && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionBtn}>
                <Edit2 size={20} color={Colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
                <Trash2 size={20} color={Colors.danger.DEFAULT} />
              </TouchableOpacity>
            </View>
          )
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {!isEditing && isCompleted && (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={24} color={Colors.success.DEFAULT} />
            <Text style={styles.completedText}>Goal Completed!</Text>
          </View>
        )}

        {!isEditing && isOverdue && (
          <View style={styles.overdueBanner}>
            <Target size={24} color={Colors.danger.DEFAULT} />
            <Text style={styles.overdueText}>Target Date Overdue</Text>
          </View>
        )}

        <View style={styles.card}>
          {isEditing ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Name</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          ) : (
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Goal Name</Text>
              <Text style={styles.readOnlyValue}>{goal.title}</Text>
            </View>
          )}

          {/* Progress Visual */}
          {!isEditing && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressAmount}>
                  {formatCurrency(goal.current_amount)}
                </Text>
                <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
              </View>
              <ProgressBar progress={pct} color={isCompleted ? Colors.success.DEFAULT : Colors.primary.DEFAULT} height={12} />
              <View style={styles.progressFooter}>
                <Text style={styles.targetLabel}>Target: {formatCurrency(goal.target_amount)}</Text>
                {!isCompleted && (
                  <Text style={styles.remainingLabel}>{formatCurrency(remaining)} remaining</Text>
                )}
              </View>
              
              {!isCompleted && (
                <View style={styles.quickActions}>
                  <Button
                    label="Update Amount"
                    variant="primary"
                    onPress={() => setAddFundsVisible(true)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Mark Complete"
                    variant="outline"
                    onPress={handleMarkCompleted}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          )}

          {isEditing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Amount</Text>
                <View style={styles.currencyInputWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.input, styles.currencyInput]}
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Saved</Text>
                <View style={styles.currencyInputWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.input, styles.currencyInput]}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Date</Text>
                <TextInput
                  style={styles.input}
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : (
            <>
              {goal.target_date && (
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Target Date</Text>
                  <Text style={styles.readOnlyValue}>
                    {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {daysRemaining !== null && !isCompleted && !isOverdue && (
                      <Text style={styles.daysRemainingText}> ({daysRemaining} days left)</Text>
                    )}
                  </Text>
                </View>
              )}
              
              {goal.notes && (
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyLabel}>Notes</Text>
                  <Text style={styles.readOnlyValue}>{goal.notes}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <Button 
              label="Cancel" 
              variant="outline" 
              onPress={() => {
                setIsEditing(false);
                setTitle(goal.title);
                setTargetAmount(goal.target_amount.toString());
                setCurrentAmount(goal.current_amount.toString());
                setTargetDate(goal.target_date || '');
                setNotes(goal.notes || '');
              }} 
              style={{ flex: 1 }} 
            />
            <Button 
              label="Save Changes" 
              onPress={handleSave} 
              isLoading={updateGoal.isPending}
              style={{ flex: 2 }} 
            />
          </View>
        ) : (
          !isCompleted && (
            <Button 
              label="Mark as Completed" 
              onPress={handleMarkCompleted} 
              variant="outline"
              isLoading={updateGoal.isPending}
              style={styles.completeBtn}
            />
          )
        )}
      </ScrollView>

      <AddFundsModal
        visible={addFundsVisible}
        onClose={() => setAddFundsVisible(false)}
        onSave={handleUpdateFunds}
        goal={goal}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 4,
  },
  actionBtn: {
    padding: 4,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success.DEFAULT}15`,
    padding: 16,
    borderRadius: Theme.radius.xl,
    gap: 12,
  },
  completedText: {
    color: Colors.success.DEFAULT,
    fontSize: 16,
    fontWeight: '700',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    padding: 16,
    borderRadius: Theme.radius.xl,
    gap: 12,
  },
  overdueText: {
    color: Colors.danger.DEFAULT,
    fontSize: 16,
    fontWeight: '700',
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
  readOnlyField: {
    gap: 4,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  readOnlyValue: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '500',
    lineHeight: 26,
  },
  daysRemainingText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  progressSection: {
    marginVertical: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  progressPct: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  targetLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  remainingLabel: {
    fontSize: 14,
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  completeBtn: {
    marginTop: 8,
  },
});
