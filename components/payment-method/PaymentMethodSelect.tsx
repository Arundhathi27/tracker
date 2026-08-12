import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ChevronDown, CreditCard, Check } from 'lucide-react-native';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { PaymentMethod } from '@/types';

interface PaymentMethodSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PaymentMethodSelect({ value, onChange, error }: PaymentMethodSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: paymentMethods, isLoading } = usePaymentMethods();

  const selectedMethod = paymentMethods?.find((m) => m.id === value);

  const handleSelect = (method: PaymentMethod) => {
    onChange(method.id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Payment Method <Text style={styles.required}>*</Text></Text>
      
      <TouchableOpacity 
        style={[styles.selector, error && styles.selectorError]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <CreditCard size={20} color={selectedMethod ? Colors.primary.DEFAULT : Colors.text.tertiary} />
          <Text style={[styles.selectorText, !selectedMethod && styles.placeholderText]}>
            {selectedMethod ? selectedMethod.name : 'Select Payment Method'}
          </Text>
        </View>
        <ChevronDown size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              </View>
            ) : paymentMethods?.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No payment methods found.</Text>
                <Text style={styles.emptySubtext}>Please add a payment method first.</Text>
              </View>
            ) : (
              <FlatList
                data={paymentMethods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.option, value === item.id && styles.selectedOption]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.optionContent}>
                      <CreditCard size={20} color={value === item.id ? Colors.primary.DEFAULT : Colors.text.secondary} />
                      <Text style={[styles.optionText, value === item.id && styles.selectedOptionText]}>
                        {item.name}
                      </Text>
                    </View>
                    {value === item.id && <Check size={20} color={Colors.primary.DEFAULT} />}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: Colors.danger.DEFAULT,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: 16,
    height: 56,
  },
  selectorError: {
    borderColor: Colors.danger.DEFAULT,
    backgroundColor: `${Colors.danger.DEFAULT}05`,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.DEFAULT,
    borderTopLeftRadius: Theme.radius['2xl'],
    borderTopRightRadius: Theme.radius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  listContent: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.muted,
  },
  selectedOption: {
    backgroundColor: `${Colors.primary.DEFAULT}05`,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
