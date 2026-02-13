import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';

const plans: { id: SubscriptionPlan; label: string; price: number; period: string }[] = [
  { id: 'pro_monthly', label: 'Pro Monthly', price: 9.99, period: '/month' },
  { id: 'pro_yearly', label: 'Pro Yearly', price: 99.99, period: '/year' },
];

const paymentMethods = [
  { id: 'mobile_money', label: 'Mobile Money' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'card', label: 'Card' },
];

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isPro, createSubscription } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro_monthly');
  const [selectedPayment, setSelectedPayment] = useState('mobile_money');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Sign in required</Text>
        <Text style={styles.emptyText}>Please sign in to upgrade your subscription.</Text>
      </View>
    );
  }

  if (isPro) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.proBadge}>PRO</Text>
        <Text style={styles.emptyTitle}>You're already a Pro member!</Text>
        <Text style={styles.emptyText}>Enjoy access to all premium features.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SpecialistDirectory' as never)}
        >
          <Text style={styles.primaryButtonText}>Browse Specialists</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;

  const handleUpgrade = async () => {
    setSubmitting(true);
    try {
      await createSubscription.mutateAsync({
        plan: selectedPlan,
        payment_method: selectedPayment,
        payment_reference: reference || undefined,
        amount: currentPlan.price,
      });
      Alert.alert(
        'Subscription Submitted',
        'Your subscription request has been submitted and is pending approval.',
        [{ text: 'OK', onPress: () => navigation.navigate('SpecialistDirectory' as never) }],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <Text style={styles.headerSubtitle}>
            Unlock access to the specialist directory and premium features
          </Text>
        </View>

        {/* Plan Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planInfo}>
                <Text style={[styles.planLabel, selectedPlan === plan.id && styles.planLabelActive]}>
                  {plan.label}
                </Text>
                <Text style={styles.planPrice}>
                  ${plan.price}{plan.period}
                </Text>
              </View>
              <View style={[styles.radio, selectedPlan === plan.id && styles.radioActive]}>
                {selectedPlan === plan.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
          {selectedPlan === 'pro_yearly' && (
            <Text style={styles.savingsText}>Save $19.89 compared to monthly</Text>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodCard, selectedPayment === method.id && styles.methodCardActive]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <Text
                style={[
                  styles.methodLabel,
                  selectedPayment === method.id && styles.methodLabelActive,
                ]}
              >
                {method.label}
              </Text>
              <View style={[styles.radio, selectedPayment === method.id && styles.radioActive]}>
                {selectedPayment === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Reference (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Transaction ID or reference number"
            value={reference}
            onChangeText={setReference}
            editable={!submitting}
          />
        </View>

        {/* Upgrade Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.upgradeButton, submitting && styles.upgradeButtonDisabled]}
            onPress={handleUpgrade}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.upgradeButtonText}>
                Upgrade for ${currentPlan.price}{currentPlan.period}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 6 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  planCardActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  planLabelActive: { color: '#007AFF' },
  planPrice: { fontSize: 14, color: '#666', marginTop: 2 },
  savingsText: { fontSize: 13, color: '#28A745', fontWeight: '600', marginTop: 4 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodCardActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
  methodLabelActive: { color: '#007AFF' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: '#007AFF' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonDisabled: { opacity: 0.5 },
  upgradeButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  proBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
});
