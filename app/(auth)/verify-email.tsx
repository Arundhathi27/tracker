import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MailOpen } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

export default function VerifyEmailScreen() {
  const { refreshSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleRefreshStatus = async () => {
    setIsChecking(true);
    await refreshSession();
    setIsChecking(false);
  };

  return (
    <View style={styles.container}>
      <ScreenContainer scrollable={false} backgroundColor="transparent">
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MailOpen size={48} color={Colors.primary.DEFAULT} strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>Verify your email</Text>
          
          <Text style={styles.subtitle}>
            Please verify your email to continue. We have sent a verification link to your inbox.
          </Text>

          <View style={styles.actionContainer}>
            <Button
              label={isChecking ? 'Checking...' : 'Refresh Status'}
              onPress={handleRefreshStatus}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isChecking}
            />
            
            <Button
              label="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
});
