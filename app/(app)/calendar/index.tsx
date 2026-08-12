import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useTransactions } from '@/hooks/useTransactions';
import { useIncomeList } from '@/hooks/useIncome';
import { formatCurrency } from '@/utils/formatters';
import { ChevronLeft, ChevronRight, Edit2, ShoppingBag, Wallet } from 'lucide-react-native';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // The hooks fetches all data. For a real production app we'd add month filters, but since we reuse existing, it will fetch what's available.
  const { data: expenses, isLoading: expensesLoading } = useTransactions();
  const { data: incomeList, isLoading: incomeLoading } = useIncomeList();

  const isLoading = expensesLoading || incomeLoading;

  // Aggregate data for calendar indicators
  const markedDates = useMemo(() => {
    if (!expenses && !incomeList) return {};
    const marks: Record<string, any> = {};

    incomeList?.forEach(inc => {
      const d = inc.date;
      if (!marks[d]) marks[d] = { dots: [] };
      if (!marks[d].dots.find((dot: any) => dot.key === 'income')) {
        marks[d].dots.push({ key: 'income', color: Colors.success.DEFAULT });
      }
    });

    expenses?.forEach(exp => {
      const d = exp.date;
      if (!marks[d]) marks[d] = { dots: [] };
      if (!marks[d].dots.find((dot: any) => dot.key === 'expense')) {
        marks[d].dots.push({ key: 'expense', color: Colors.danger.DEFAULT });
      }
    });

    // Mark selected date
    if (selectedDate) {
      if (!marks[selectedDate]) marks[selectedDate] = { dots: [] };
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: Colors.primary.DEFAULT,
      };
    }

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    if (marks[today]) {
      marks[today].marked = true;
    }

    return marks;
  }, [expenses, incomeList, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString.slice(0, 7));
  };

  // Get daily details
  const dailyIncome = useMemo(() => {
    if (!incomeList) return [];
    return incomeList.filter(inc => inc.date === selectedDate);
  }, [incomeList, selectedDate]);

  const dailyExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(exp => exp.date === selectedDate);
  }, [expenses, selectedDate]);

  const totalIncome = dailyIncome.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpense = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const dailyNet = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      <Header title="Calendar View" showBack />
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.calendarCard}>
            <Calendar
              current={currentMonth + '-01'}
              onDayPress={onDayPress}
              onMonthChange={onMonthChange}
              markedDates={markedDates}
              markingType={'multi-dot'}
              theme={{
                backgroundColor: Colors.surface.DEFAULT,
                calendarBackground: Colors.surface.DEFAULT,
                textSectionTitleColor: Colors.text.secondary,
                selectedDayBackgroundColor: Colors.primary.DEFAULT,
                selectedDayTextColor: Colors.surface.DEFAULT,
                todayTextColor: Colors.primary.DEFAULT,
                dayTextColor: Colors.text.primary,
                textDisabledColor: Colors.text.tertiary,
                dotColor: Colors.primary.DEFAULT,
                selectedDotColor: Colors.surface.DEFAULT,
                arrowColor: Colors.primary.DEFAULT,
                monthTextColor: Colors.text.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
              renderArrow={(direction: 'left' | 'right') => (
                direction === 'left' ? <ChevronLeft size={24} color={Colors.primary.DEFAULT} /> : <ChevronRight size={24} color={Colors.primary.DEFAULT} />
              )}
            />
          </View>

          <View style={styles.dailyDetails}>
            <Text style={styles.detailsTitle}>
              {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryValue, { color: Colors.success.DEFAULT }]}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger.DEFAULT }]}>{formatCurrency(totalExpense)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Net</Text>
                <Text style={[styles.summaryValue, { color: dailyNet >= 0 ? Colors.success.DEFAULT : Colors.danger.DEFAULT }]}>
                  {dailyNet > 0 ? '+' : ''}{formatCurrency(dailyNet)}
                </Text>
              </View>
            </View>

            {dailyIncome.length === 0 && dailyExpenses.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions on this date.</Text>
              </View>
            )}

            {dailyIncome.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Income Records</Text>
                {dailyIncome.map(inc => (
                  <TouchableOpacity 
                    key={inc.id} 
                    style={styles.recordItem}
                    onPress={() => router.push(`/(app)/income/${inc.id}` as any)}
                  >
                    <View style={[styles.recordIcon, { backgroundColor: `${Colors.success.DEFAULT}20` }]}>
                      <Wallet size={20} color={Colors.success.DEFAULT} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>{inc.source}</Text>
                      {inc.description !== inc.source && <Text style={styles.recordDesc}>{inc.description}</Text>}
                    </View>
                    <Text style={[styles.recordAmount, { color: Colors.success.DEFAULT }]}>+{formatCurrency(inc.amount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {dailyExpenses.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Expense Records</Text>
                {dailyExpenses.map(exp => (
                  <TouchableOpacity 
                    key={exp.id} 
                    style={styles.recordItem}
                    onPress={() => router.push(`/(app)/transactions/${exp.id}` as any)}
                  >
                    <View style={[styles.recordIcon, { backgroundColor: `${Colors.danger.DEFAULT}20` }]}>
                      <ShoppingBag size={20} color={Colors.danger.DEFAULT} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>{exp.category?.name || 'Uncategorized'}</Text>
                      {exp.description && <Text style={styles.recordDesc}>{exp.description}</Text>}
                    </View>
                    <Text style={[styles.recordAmount, { color: Colors.danger.DEFAULT }]}>-{formatCurrency(exp.amount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </View>
        </ScrollView>
      )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  calendarCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
    marginBottom: 24,
    paddingBottom: 8,
  },
  dailyDetails: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
    padding: 12,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 15,
  },
  listSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  recordDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '700',
  }
});
