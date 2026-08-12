import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePaymentMethod } from '@/hooks/usePaymentMethods';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Payment Method name is required'),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export default function CreatePaymentMethodScreen() {
  const { mutateAsync: createPaymentMethod } = useCreatePaymentMethod();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    try {
      await createPaymentMethod({
        name: data.name,
      });
      router.back();
    } catch (error) {
      // Error handled by BaseService
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header showBack title="Add Payment Method" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name"
                  placeholder="e.g. UPI, Cash, Credit Card"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isSubmitting ? 'Saving...' : 'Save Payment Method'}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  formContainer: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  section: {
    marginBottom: 24,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.surface.DEFAULT,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
  },
});
