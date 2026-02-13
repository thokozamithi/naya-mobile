import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { usePayments } from '@/hooks/useData';

export default function PaymentHistoryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { data: payments = [], isLoading, refetch } = usePayments();
  const [refreshing, setRefreshing] = React.useState(false);

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

  // Group payments by status
  const completedPayments = payments.filter((p: any) => p.status === 'completed');
  const pendingPayments = payments.filter((p: any) =>
    p.status === 'pending' || p.status === 'processing'
  );
  const otherPayments = payments.filter((p: any) =>
    p.status !== 'completed' && p.status !== 'pending' && p.status !== 'processing'
  );

  // Calculate total paid
  const totalPaid = completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
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
                ${totalPaid.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Total Paid</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#FF9500' }]}>
                {pendingPayments.length}
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
            <Text style={styles.emptyText}>No payment history</Text>
            <Text style={styles.emptySubtext}>Your rent payments will appear here</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('PayRent')}
            >
              <Text style={styles.emptyButtonText}>Make a Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Payments</Text>
            {pendingPayments.map((payment: any) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>${parseFloat(payment.amount).toFixed(2)}</Text>
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
                        style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>{formatDate(payment.created_at)}</Text>
                  </View>
                </View>
                {payment.notes && (
                  <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Completed Payments Section */}
        {completedPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Payments</Text>
            {completedPayments.map((payment: any) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>${parseFloat(payment.amount).toFixed(2)}</Text>
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
                        style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        ✓ {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.paid_date || payment.created_at)}
                    </Text>
                  </View>
                </View>
                {payment.notes && (
                  <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Other Payments (failed, refunded, etc.) */}
        {otherPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Payments</Text>
            {otherPayments.map((payment: any) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </Text>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>${parseFloat(payment.amount).toFixed(2)}</Text>
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
                        style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        {payment.status}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>{formatDate(payment.created_at)}</Text>
                  </View>
                </View>
                {payment.notes && (
                  <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {payments.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PayRent')}
        >
          <Text style={styles.fabText}>+ New Payment</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
