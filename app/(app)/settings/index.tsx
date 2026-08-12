import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Settings, LogOut, ChevronRight, Download, FileText, Shield, Bell } from 'lucide-react-native';
import { useAuthStore } from '@/store';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { exportTransactionsToCSV } from '@/utils/export';
import { transactionService } from '@/services';
import { notificationService } from '@/services';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    // Check if we have notification permissions already
    const checkPermissions = async () => {
      // simplified check for the switch state, ideally fetch from a local settings store
      setNotificationsEnabled(false); 
    };
    checkPermissions();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your system settings.');
        setNotificationsEnabled(false);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const allTx = await transactionService.getTransactions();
      if (allTx && allTx.length > 0) {
        await exportTransactionsToCSV(allTx);
      } else {
        Alert.alert('No Transactions', 'You do not have any transactions to export.');
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'An error occurred while exporting.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Settings" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrapper}>
                  <Bell size={20} color={Colors.text.secondary} />
                </View>
                <Text style={styles.rowText}>Push Notifications</Text>
              </View>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={handleToggleNotifications} 
                trackColor={{ false: Colors.border.DEFAULT, true: Colors.primary.DEFAULT }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Export</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
              style={styles.cardButton}
            >
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrapper}>
                    <Download size={20} color={Colors.text.secondary} />
                  </View>
                  <Text style={styles.rowText}>{isExporting ? 'Exporting...' : 'Export Transactions to CSV'}</Text>
                </View>
                <ChevronRight size={20} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardButton}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrapper}>
                    <FileText size={20} color={Colors.text.secondary} />
                  </View>
                  <Text style={styles.rowText}>Terms of Service</Text>
                </View>
                <ChevronRight size={20} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardButton}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrapper}>
                    <Shield size={20} color={Colors.text.secondary} />
                  </View>
                  <Text style={styles.rowText}>Privacy Policy</Text>
                </View>
                <ChevronRight size={20} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.logoutSection}>
          <Button
            label="Log Out"
            onPress={handleLogout}
            variant="outline"
            leftIcon={<LogOut size={20} color={Colors.danger.DEFAULT} />}
            style={styles.logoutButton}
          />
          <Text style={styles.version}>BudgetWise v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    overflow: 'hidden',
  },
  cardButton: {
    padding: 0,
    height: 'auto',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.DEFAULT,
    marginLeft: 68,
  },
  logoutSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButton: {
    borderColor: Colors.danger.DEFAULT,
    width: '100%',
    marginBottom: 24,
  },
  version: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
});
