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

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const { signup } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    const { error } = await signup(data.email, data.password, data.fullName);
    setIsSubmitting(false);

    if (error) {
      setAuthError(error.message);
    } else {
      // Supabase sends a confirmation email
      router.replace('/(auth)/verify-email');
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Create Account" />
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer scrollable backgroundColor="transparent">
          <View style={styles.content}>
            <Text style={styles.subtitle}>Join BudgetWise to start tracking your finances.</Text>

            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <Input
                      placeholder="John Doe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.fullName?.message}
                      autoCapitalize="words"
                    />
                    {errors.fullName && <Text style={styles.inputError}>{errors.fullName.message}</Text>}
                  </View>
                )}
              />

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

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <Input
                      placeholder="Create a password"
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
                      placeholder="Confirm your password"
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
                  label={isSubmitting ? 'Creating Account...' : 'Create Account'}
                  onPress={handleSubmit(onSubmit)}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Text 
                  style={styles.footerLink}
                  onPress={() => router.back()}
                >
                  Sign In
                </Text>
              </View>
            </View>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary.DEFAULT,
    fontSize: 15,
    fontWeight: '700',
  },
});
