import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, Pressable
} from 'react-native';
import { router } from 'expo-router';
import {
  User, Mail, Calendar, KeyRound, Settings as SettingsIcon,
  LogOut, ChevronRight, TrendingUp, Wallet, PieChart, CheckSquare
} from 'lucide-react-native';
import { useAuthStore } from '@/store';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMonthlyBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useIncomeList } from '@/hooks/useIncome';
import { formatCurrency } from '@/utils/formatters';

export default function ProfileScreen() {
  const { user, session, logout } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Stats data
  const { data: budgets } = useMonthlyBudgets();
  const { data: allExpenses } = useTransactions({ type: 'expense' });
  const { data: allIncome } = useIncomeList();

  // Compute lifetime stats
  const totalBudgets = budgets?.length || 0;
  const totalExpensesTx = allExpenses?.length || 0;
  const totalSpent = allExpenses?.reduce((s, t) => s + t.amount, 0) || 0;
  const totalIncome = allIncome?.reduce((s, i) => s + i.amount, 0) || 0;

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully.');
      setPassword('');
      setShowPasswordForm(false);
    } catch (e: any) {
      Alert.alert('Change Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const joinedDate = new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Initials for avatar
  const initials = (user?.full_name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        rightElement={
          <Pressable onPress={() => router.push('/(app)/settings' as any)} style={styles.settingsBtn}>
            <SettingsIcon size={22} color={Colors.text.primary} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Avatar + Name ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.nameText}>{user?.full_name || 'User'}</Text>
            <Text style={styles.emailText}>{session?.user?.email}</Text>
          </View>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${Colors.success.DEFAULT}15` }]}>
                <Wallet size={18} color={Colors.success.DEFAULT} />
              </View>
              <Text style={[styles.statValue, { fontSize: 13 }]}>{formatCurrency(totalIncome)}</Text>
              <Text style={styles.statLabel}>Lifetime Income</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${Colors.accent.DEFAULT}15` }]}>
                <PieChart size={18} color={Colors.accent.DEFAULT} />
              </View>
              <Text style={[styles.statValue, { fontSize: 13 }]}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
          
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                <Wallet size={18} color={Colors.primary.DEFAULT} />
              </View>
              <Text style={styles.statValue}>{totalBudgets}</Text>
              <Text style={styles.statLabel}>Budgets</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${Colors.danger.DEFAULT}15` }]}>
                <TrendingUp size={18} color={Colors.danger.DEFAULT} />
              </View>
              <Text style={styles.statValue}>{totalExpensesTx}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
          </View>

          {/* ── Account Info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                  <Mail size={16} color={Colors.primary.DEFAULT} />
                </View>
                <Text style={styles.infoText} numberOfLines={1}>{session?.user?.email}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: `${Colors.success.DEFAULT}15` }]}>
                  <Calendar size={16} color={Colors.success.DEFAULT} />
                </View>
                <Text style={styles.infoText}>Joined {joinedDate}</Text>
              </View>
            </View>
          </View>

          {/* ── Update Name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <View style={styles.card}>
              <Input
                label="Display Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                leftIcon={<User size={18} color={Colors.text.tertiary} />}
              />
              <View style={{ height: 12 }} />
              <Button
                label={isUpdating ? 'Saving...' : 'Save Name'}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
                variant="primary"
                fullWidth
              />
            </View>
          </View>

          {/* ── Change Password ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              {!showPasswordForm ? (
                <TouchableOpacity style={styles.cardRow} onPress={() => setShowPasswordForm(true)}>
                  <View style={styles.cardRowLeft}>
                    <View style={[styles.infoIcon, { backgroundColor: `${Colors.warning.DEFAULT}15` }]}>
                      <KeyRound size={16} color={Colors.warning.DEFAULT} />
                    </View>
                    <Text style={styles.cardRowText}>Change Password</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              ) : (
                <>
                  <Input
                    label="New Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    secureTextEntry
                    leftIcon={<KeyRound size={18} color={Colors.text.tertiary} />}
                  />
                  <View style={{ height: 12 }} />
                  <View style={styles.btnRow}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      onPress={() => { setShowPasswordForm(false); setPassword(''); }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={isUpdating ? 'Saving...' : 'Update'}
                      onPress={handleChangePassword}
                      variant="primary"
                      disabled={isUpdating || password.length < 6}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── Quick Links ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.cardRow, { borderBottomWidth: 1, borderBottomColor: Colors.border.DEFAULT }]}
                onPress={() => router.push('/(app)/fixed-expenses' as any)}
              >
                <View style={styles.cardRowLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                    <CheckSquare size={16} color={Colors.primary.DEFAULT} />
                  </View>
                  <Text style={styles.cardRowText}>Fixed Expenses Checklist</Text>
                </View>
                <ChevronRight size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardRow}
                onPress={() => router.push('/(app)/settings' as any)}
              >
                <View style={styles.cardRowLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: `${Colors.primary.DEFAULT}15` }]}>
                    <SettingsIcon size={16} color={Colors.primary.DEFAULT} />
                  </View>
                  <Text style={styles.cardRowText}>Settings</Text>
                </View>
                <ChevronRight size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Log Out ── */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color={Colors.danger.DEFAULT} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Text style={styles.version}>BudgetWise v1.0.0</Text>

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
  settingsBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 20,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Theme.shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    ...Theme.shadows.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Sections
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    ...Theme.shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text.secondary,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border.DEFAULT,
    marginVertical: 4,
    marginLeft: 44,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: `${Colors.danger.DEFAULT}50`,
    backgroundColor: `${Colors.danger.DEFAULT}08`,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
  },
  version: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
