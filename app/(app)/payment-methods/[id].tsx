import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '@/hooks/usePaymentMethods';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Trash2 } from 'lucide-react-native';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Payment Method name is required'),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export default function EditPaymentMethodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: paymentMethod, isLoading: isFetching } = usePaymentMethod(id);
  const { mutateAsync: updatePaymentMethod } = useUpdatePaymentMethod();
  const { mutateAsync: deletePaymentMethod } = useDeletePaymentMethod();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (paymentMethod) {
      reset({
        name: paymentMethod.name,
      });
    }
  }, [paymentMethod, reset]);

  const onSubmit = async (data: PaymentMethodFormValues) => {
    try {
      await updatePaymentMethod({
        id,
        dto: {
          name: data.name,
        },
      });
      router.back();
    } catch (error) {
      // Error handled by BaseService
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Payment Method', 'Are you sure you want to delete this payment method? This action cannot be undone unless it is used in transactions.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePaymentMethod(id);
            router.back();
          } catch (error) {
            // Error handled by BaseService
          }
        }
      }
    ]);
  };

  if (isFetching) {
    return (
      <View style={styles.container}>
        <Header showBack title="Edit Payment Method" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header 
        showBack 
        title="Edit Payment Method" 
        rightElement={
          <Button
            label=""
            variant="ghost"
            onPress={handleDelete}
            leftIcon={<Trash2 size={24} color={Colors.danger.DEFAULT} />}
            style={styles.deleteButton}
          />
        }
      />
      
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
        
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerText}>
            Once you delete a payment method, there is no going back. Please be certain.
          </Text>
          <Button
            label="Delete Payment Method"
            onPress={handleDelete}
            variant="danger"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isSubmitting ? 'Saving...' : 'Save Changes'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
  },
  dangerZone: {
    marginTop: 32,
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger.DEFAULT,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  fullDeleteButton: {
    borderColor: Colors.danger.DEFAULT,
  },
  fullDeleteButtonText: {
    color: Colors.danger.DEFAULT,
  },
});
