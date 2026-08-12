import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/store';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);
    setIsSubmitting(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Reset Password" />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer scrollable backgroundColor="transparent">
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Enter your email address and we will send you a link to reset your password.
            </Text>

            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                </Text>
                <Button
                  label="Back to Login"
                  onPress={() => router.back()}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email</Text>
                      <Input
                        placeholder="john@example.com"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                      {errors.email && <Text style={styles.inputError}>{errors.email.message}</Text>}
                    </View>
                  )}
                />

                <View style={{ marginTop: 12 }}>
                  <Button
                    label={isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    onPress={handleSubmit(onSubmit)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            )}
          </View>
        </ScreenContainer>
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
  content: {
    padding: 24,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    padding: 16,
    borderRadius: Theme.radius.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: `${Colors.success.DEFAULT}10`,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: `${Colors.success.DEFAULT}30`,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success.DEFAULT,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 4,
  },
  inputError: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginLeft: 4,
    marginTop: -4,
  },
});
