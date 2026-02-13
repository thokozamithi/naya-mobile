import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useTenantProperty, useCreatePayment } from '@/hooks/useData';

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'check', label: 'Check', icon: '📝' },
  { value: 'cash', label: 'Cash', icon: '💵' },
];

export default function PayRentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { property, unit } = useTenantProperty();
  const createPayment = useCreatePayment();

  // Get current month and year for payment period
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // State
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill amount from unit's monthly rent
  useEffect(() => {
    if (unit?.monthly_rent) {
      setAmount(unit.monthly_rent.toString());
    }
  }, [unit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check all fields and try again.');
      return;
    }

    if (!property?.id) {
      Alert.alert('Error', 'Property information not found. Please join a property first.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate due date (first of current month)
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      await createPayment.mutateAsync({
        user_id: user!.id,
        property_id: property.id,
        unit_id: unit?.id || null,
        amount: parseFloat(amount),
        payment_type: 'rent',
        payment_method: paymentMethod!,
        status: 'pending', // In real app, would be 'processing' until payment processor confirms
        due_date: dueDate.toISOString().split('T')[0],
        paid_date: null,
        payment_period: currentMonth,
        notes: notes.trim() || null,
        transaction_id: null, // Would come from payment processor
        receipt_url: null,
      });

      Alert.alert(
        'Payment Submitted',
        `Your rent payment of $${parseFloat(amount).toFixed(2)} for ${currentMonth} has been submitted. You will receive a confirmation once processed.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Payment submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pay Rent</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Not linked to a property</Text>
          <Text style={styles.errorSubtext}>Please join a property before making a payment</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('JoinProperty')}
          >
            <Text style={styles.primaryButtonText}>Join Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pay Rent</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Property Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Property</Text>
          <Text style={styles.infoValue}>{property.name}</Text>
          {unit && (
            <>
              <Text style={[styles.infoLabel, { marginTop: 8 }]}>Unit</Text>
              <Text style={styles.infoValue}>{unit.unit_name}</Text>
            </>
          )}
          <Text style={[styles.infoLabel, { marginTop: 8 }]}>Payment Period</Text>
          <Text style={styles.infoValue}>{currentMonth}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Amount <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
          </View>
          {errors.amount && <Text style={styles.errorMessage}>{errors.amount}</Text>}
          {unit?.monthly_rent && (
            <Text style={styles.hint}>Monthly rent: ${unit.monthly_rent}/mo</Text>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Payment Method <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodOption,
                  paymentMethod === method.value && styles.methodOptionActive,
                ]}
                onPress={() => setPaymentMethod(method.value)}
                disabled={isSubmitting}
              >
                <Text style={styles.methodIcon}>{method.icon}</Text>
                <Text
                  style={[
                    styles.methodLabel,
                    paymentMethod === method.value && styles.methodLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.paymentMethod && <Text style={styles.errorMessage}>{errors.paymentMethod}</Text>}
        </View>

        {/* Notes (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this payment..."
            multiline
            numberOfLines={3}
            editable={!isSubmitting}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ℹ️ Payment processing functionality is currently in MVP mode. In production, this would
            integrate with a payment processor (e.g., Stripe, PayPal) for secure payment handling.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    height: 50,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodOption: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    padding: 12,
    alignItems: 'center',
    width: '48%',
  },
  methodOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF08',
  },
  methodIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  methodLabelActive: {
    color: '#007AFF',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disclaimer: {
    backgroundColor: '#FFF9E6',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
