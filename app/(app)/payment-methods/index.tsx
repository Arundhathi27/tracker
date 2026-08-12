import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Plus, CreditCard, ChevronRight } from 'lucide-react-native';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { PaymentMethod } from '@/types';

function PaymentMethodCard({ method, onPress }: { method: PaymentMethod; onPress: (m: PaymentMethod) => void }) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(method)}>
      <View style={styles.cardIcon}>
        <CreditCard size={24} color={Colors.primary.DEFAULT} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{method.name}</Text>
      </View>
      <ChevronRight size={20} color={Colors.text.tertiary} />
    </Pressable>
  );
}

export default function PaymentMethodsOverviewScreen() {
  const { data: paymentMethods, isLoading } = usePaymentMethods();

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No payment methods</Text>
        <Text style={styles.emptySubtitle}>
          Add your bank accounts, credit cards, UPI, or cash wallets to start tracking your spending correctly.
        </Text>
        <Button
          label="Add Payment Method"
          onPress={() => router.push('/(app)/payment-methods/create' as any)}
          variant="primary"
          leftIcon={<Plus size={20} color={Colors.white} />}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Payment Methods" />
      <View style={styles.content}>
        <FlatList
          data={paymentMethods || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PaymentMethodCard 
              method={item} 
              onPress={(m: PaymentMethod) => router.push(`/(app)/payment-methods/${m.id}` as any)} 
            />
          )}
          ListEmptyComponent={renderEmptyComponent}
        />

        {paymentMethods && paymentMethods.length > 0 && (
          <View style={styles.fabContainer}>
            <Button
              label="New Payment Method"
              onPress={() => router.push('/(app)/payment-methods/create' as any)}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Plus size={24} color={Colors.white} />}
            />
          </View>
        )}
      </View>
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
  },
  listContent: {
    padding: 24,
    paddingBottom: 100, // Space for FAB
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
    backgroundColor: Colors.surface.DEFAULT,
    paddingVertical: 40,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.DEFAULT,
    padding: 16,
    borderRadius: Theme.radius.xl,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    ...Theme.shadows.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
