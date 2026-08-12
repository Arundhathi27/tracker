import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    
    setIsSubmitting(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Update Password" />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer scrollable backgroundColor="transparent">
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Please enter your new password below.
            </Text>

            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Password Updated!</Text>
                <Text style={styles.successText}>
                  Your password has been changed successfully. You can now use it to log in.
                </Text>
                <Button
                  label="Go to Dashboard"
                  onPress={() => router.replace('/(app)/dashboard' as any)}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>New Password</Text>
                      <Input
                        placeholder="Enter new password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.password?.message}
                        secureTextEntry
                      />
                      {errors.password && <Text style={styles.inputError}>{errors.password.message}</Text>}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <Input
                        placeholder="Confirm your new password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.confirmPassword?.message}
                        secureTextEntry
                      />
                      {errors.confirmPassword && <Text style={styles.inputError}>{errors.confirmPassword.message}</Text>}
                    </View>
                  )}
                />

                <View style={{ marginTop: 12 }}>
                  <Button
                    label={isSubmitting ? 'Updating...' : 'Update Password'}
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
