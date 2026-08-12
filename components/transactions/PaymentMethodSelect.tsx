import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { PaymentMethod } from '@/types';
import { Colors } from '@/constants/colors';
import { 
  CreditCard, Smartphone, Banknote, Wallet, Landmark, HelpCircle 
} from 'lucide-react-native';

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('upi') || lower.includes('phone') || lower.includes('mobile')) return Smartphone;
  if (lower.includes('cash')) return Banknote;
  if (lower.includes('card') || lower.includes('debit') || lower.includes('credit')) return CreditCard;
  if (lower.includes('bank') || lower.includes('net')) return Landmark;
  if (lower.includes('wallet')) return Wallet;
  return HelpCircle;
};

interface PaymentMethodSelectProps {
  value?: string | null;
  onChange: (methodId: string) => void;
  error?: string;
}

export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({ value, onChange, error }) => {
  const { data: methods, isLoading } = usePaymentMethods();

  if (isLoading) {
    return <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ padding: 20 }} />;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Payment Method (Optional)</Text>

      {(!methods || methods.length === 0) ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>No payment methods found.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {methods.map((method: PaymentMethod) => {
            const isSelected = value === method.id;
            const IconComp = getPaymentIcon(method.name);
            const iconColor = isSelected ? Colors.primary.DEFAULT : Colors.text.secondary;

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  isSelected && { borderColor: Colors.primary.DEFAULT, borderWidth: 2 }
                ]}
                onPress={() => onChange(method.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrapper, { backgroundColor: isSelected ? `${Colors.primary.DEFAULT}20` : Colors.background.secondary }]}>
                  <IconComp size={20} color={iconColor} />
                </View>
                <Text style={[styles.methodName, isSelected && { color: Colors.primary.DEFAULT }]} numberOfLines={1}>
                  {method.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  methodCard: {
    width: '30%', // ~3 per row depending on gap
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  warningBox: {
    padding: 16,
    backgroundColor: `${Colors.warning.DEFAULT}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.warning.DEFAULT}30`,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning.DEFAULT,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger.DEFAULT,
    marginTop: 4,
  },
});
