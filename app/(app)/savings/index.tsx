import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, Target, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatCurrency } from '@/utils/formatters';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

export default function SavingsGoalsScreen() {
  const { data: goals, isLoading, error } = useSavingsGoals();

  const handleAddGoal = () => {
    router.push('/(app)/savings/create' as any);
  };

  const handleGoalPress = (id: string) => {
    router.push(`/(app)/savings/${id}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Savings Goals" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Savings Goals" />
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load savings goals.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Savings Goals" 
        rightElement={
          <TouchableOpacity onPress={handleAddGoal} style={styles.headerBtn}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!goals || goals.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Target size={48} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={styles.emptyTitle}>No savings goals yet.</Text>
            <Text style={styles.emptySubtitle}>Set a goal and start tracking your savings progress today.</Text>
            <Button
              label="Create Goal"
              onPress={handleAddGoal}
              variant="primary"
              leftIcon={<Plus size={20} color={Colors.white} />}
            />
          </View>
        ) : (
          <View style={styles.goalsList}>
            {goals.map(goal => {
              const pct = goal.target_amount > 0 ? Math.min(1, Math.max(0, goal.current_amount / goal.target_amount)) : 0;
              const isCompleted = goal.status === 'completed' || goal.current_amount >= goal.target_amount;
              const remaining = goal.target_amount - goal.current_amount;
              
              let isOverdue = false;
              if (goal.target_date && !isCompleted) {
                const targetDate = new Date(goal.target_date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (targetDate < today) {
                  isOverdue = true;
                }
              }

              return (
                <TouchableOpacity 
                  key={goal.id} 
                  style={styles.goalCard}
                  onPress={() => handleGoalPress(goal.id)}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleRow}>
                      <View style={[styles.iconWrap, isCompleted && { backgroundColor: `${Colors.success.DEFAULT}20` }]}>
                        {isCompleted ? (
                          <CheckCircle2 size={20} color={Colors.success.DEFAULT} />
                        ) : (
                          <Target size={20} color={Colors.primary.DEFAULT} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        {goal.target_date && (
                          <Text style={styles.goalDate}>
                            Target: {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isCompleted ? (
                      <View style={styles.badgeSuccess}>
                        <Text style={styles.badgeSuccessText}>Completed</Text>
                      </View>
                    ) : isOverdue ? (
                      <View style={styles.badgeDanger}>
                        <Text style={styles.badgeDangerText}>Overdue</Text>
                      </View>
                    ) : (
                      <ChevronRight size={20} color={Colors.text.tertiary} />
                    )}
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressAmount}>
                        {formatCurrency(goal.current_amount)} <Text style={styles.targetAmount}>of {formatCurrency(goal.target_amount)}</Text>
                      </Text>
                      <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
                    </View>
                    <ProgressBar progress={pct} color={isCompleted ? Colors.success.DEFAULT : Colors.primary.DEFAULT} />
                    {!isCompleted && (
                      <Text style={styles.remainingText}>
                        {formatCurrency(Math.max(0, remaining))} left to save
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
  headerBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  emptyBox: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary.DEFAULT}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Theme.radius.full,
    gap: 8,
  },
  emptyBtnText: {
    color: Colors.surface.DEFAULT,
    fontSize: 16,
    fontWeight: '600',
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary.DEFAULT}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  badgeSuccess: {
    backgroundColor: `${Colors.success.DEFAULT}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  badgeSuccessText: {
    color: Colors.success.DEFAULT,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeDanger: {
    backgroundColor: `${Colors.danger.DEFAULT}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  badgeDangerText: {
    color: Colors.danger.DEFAULT,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  targetAmount: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  remainingText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 10,
    fontWeight: '500',
  }
});
