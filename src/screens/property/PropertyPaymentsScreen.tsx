import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyPayments, useUpdatePayment } from '@/hooks/useData';

type RouteParams = {
  propertyId: string;
  propertyName: string;
};

export default function PropertyPaymentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { propertyId, propertyName } = (route.params as RouteParams) || {};
  const { activeRole } = useAuth();
  const { data: payments = [], isLoading, refetch } = usePropertyPayments(propertyId);
  const updatePayment = useUpdatePayment();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'failed':
        return '#FF3B30';
      case 'refunded':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'check':
        return '📝';
      case 'cash':
        return '💵';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPaymentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleUpdateStatus = async (paymentId: string, currentStatus: string) => {
    if (activeRole !== 'landlord' && activeRole !== 'employee') {
      Alert.alert('Permission Denied', 'Only landlords can update payment status');
      return;
    }

    const statusOptions = [
      { value: 'pending', label: '⏳ Pending' },
      { value: 'processing', label: '🔄 Processing' },
      { value: 'completed', label: '✓ Completed' },
      { value: 'failed', label: '✗ Failed' },
      { value: 'refunded', label: '↩️ Refunded' },
    ];

    Alert.alert(
      'Update Payment Status',
      `Current status: ${currentStatus}\n\nSelect new status:`,
      [
        ...statusOptions.map((status) => ({
          text: status.label,
          onPress: async () => {
            if (status.value === currentStatus) return;

            try {
              const updateData: any = {
                id: paymentId,
                status: status.value,
              };

              // Set paid_date when marking as completed
              if (status.value === 'completed' && currentStatus !== 'completed') {
                updateData.paid_date = new Date().toISOString();
              }

              await updatePayment.mutateAsync(updateData);
              Alert.alert('Success', `Payment status updated to ${status.value}`);
            } catch (error: any) {
              console.error('Status update error:', error);
              Alert.alert('Error', error.message || 'Failed to update status');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Group payments by status
  const pendingPayments = payments.filter(
    (p: any) => p.status === 'pending' || p.status === 'processing'
  );
  const completedPayments = payments.filter((p: any) => p.status === 'completed');
  const otherPayments = payments.filter(
    (p: any) => p.status !== 'completed' && p.status !== 'pending' && p.status !== 'processing'
  );

  // Calculate totals
  const totalReceived = completedPayments.reduce(
    (sum: number, p: any) => sum + parseFloat(p.amount),
    0
  );
  const totalPending = pendingPayments.reduce(
    (sum: number, p: any) => sum + parseFloat(p.amount),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>{propertyName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{payments.length}</Text>
              <Text style={styles.summaryLabel}>Total Payments</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                ${totalReceived.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Total Received</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#FF9500' }]}>
                ${totalPending.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                {completedPayments.length}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && !refreshing && (
          <View style={styles.section}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && payments.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No payments yet</Text>
            <Text style={styles.emptySubtext}>
              Payments from tenants for this property will appear here
            </Text>
          </View>
        )}

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Payments ({pendingPayments.length})
            </Text>
            {pendingPayments.map((payment: any) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentCard}
                onPress={() => handleUpdateStatus(payment.id, payment.status)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>
                        ${parseFloat(payment.amount).toFixed(2)}
                      </Text>
                      <Text style={styles.paymentType}>{formatPaymentType(payment.payment_type)}</Text>
                      {payment.payment_period && (
                        <Text style={styles.paymentPeriod}>{payment.payment_period}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(payment.status) }]}
                      >
                        {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>{formatDate(payment.created_at)}</Text>
                    <Text style={styles.tapHint}>Tap to update</Text>
                  </View>
                </View>
                {payment.notes && <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Payments Section */}
        {completedPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Completed Payments ({completedPayments.length})
            </Text>
            {completedPayments.map((payment: any) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentCard}
                onPress={() => handleUpdateStatus(payment.id, payment.status)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>
                        ${parseFloat(payment.amount).toFixed(2)}
                      </Text>
                      <Text style={styles.paymentType}>{formatPaymentType(payment.payment_type)}</Text>
                      {payment.payment_period && (
                        <Text style={styles.paymentPeriod}>{payment.payment_period}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(payment.status) }]}
                      >
                        ✓ {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.paid_date || payment.created_at)}
                    </Text>
                  </View>
                </View>
                {payment.notes && <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other Payments (failed, refunded, etc.) */}
        {otherPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Payments ({otherPayments.length})</Text>
            {otherPayments.map((payment: any) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentCard}
                onPress={() => handleUpdateStatus(payment.id, payment.status)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>
                        ${parseFloat(payment.amount).toFixed(2)}
                      </Text>
                      <Text style={styles.paymentType}>{formatPaymentType(payment.payment_type)}</Text>
                      {payment.payment_period && (
                        <Text style={styles.paymentPeriod}>{payment.payment_period}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '22' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(payment.status) }]}
                      >
                        {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>{formatDate(payment.created_at)}</Text>
                    <Text style={styles.tapHint}>Tap to update</Text>
                  </View>
                </View>
                {payment.notes && <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  paymentType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  paymentPeriod: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentDate: {
    fontSize: 11,
    color: '#999',
  },
  tapHint: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 2,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  skeletonLine: {
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
  },
});
