import { useState, useCallback, useState as useReactState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceRequests, usePropertyRequests } from '@/hooks/useData';
import { useMembership, useSubscription, useUserProfile } from '@/hooks/useQueries';

const TABS = [
  'Overview', 'Payments', 'Maintenance', 'Messages', 'Lease', 'Settings', 'Help'
];

const TenantDashboard = ({ navigation }: any) => {
  const { user, signOut, activeRole } = useAuth();
    const [activeTab, setActiveTab] = useReactState('Overview');
  const { membership, isLoading: membershipLoading } = useMembership();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { profile } = useUserProfile();
  const { data: requests = [], isLoading: reqLoading } = useMaintenanceRequests(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const pendingRequests = requests.filter((r: any) => r.status === 'pending' || r.status === 'open');
  const isLoading = membershipLoading || subscriptionLoading || reqLoading;

  return (
    <>
      <DashboardHeader
        onLogoPress={() => navigation.navigate('Home')}
        onRoleSwitch={() => navigation.navigate('RoleSelection')}
        onSignOut={() => { signOut(); navigation.navigate('Home'); }}
        userName={profile?.full_name || user?.email}
        role={activeRole || undefined}
      />
      {/* Tab triggers */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tenant Dashboard</Text>
          <Text style={styles.subtitle}>{profile?.full_name || user?.email}</Text>
        </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#007AFF' }]}>
          <Text style={styles.kpiValue}>
            {isLoading ? '-' : membership?.status || 'Free'}
          </Text>
          <Text style={styles.kpiLabel}>Membership</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
          <Text style={styles.kpiValue}>
            {isLoading ? '-' : subscription?.plan?.replace('_', ' ') || 'Free'}
          </Text>
          <Text style={styles.kpiLabel}>Subscription</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#FF9500' }]}>
          <Text style={styles.kpiValue}>
            {isLoading ? '-' : pendingRequests.length}
          </Text>
          <Text style={styles.kpiLabel}>Open Requests</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#AF52DE' }]}>
          <Text style={styles.kpiValue}>
            {isLoading ? '-' : requests.length}
          </Text>
          <Text style={styles.kpiLabel}>Total Requests</Text>
        </View>
      </View>

      {/* Maintenance Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Maintenance Requests</Text>
        {isLoading ? (
          [1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
            </View>
          ))
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyText}>No maintenance requests</Text>
            <Text style={styles.emptySubtext}>Submit a request when you need something fixed</Text>
          </View>
        ) : (
          requests.slice(0, 5).map((req: any) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={[styles.priorityDot, {
                backgroundColor: req.priority === 'high' ? '#FF3B30' :
                  req.priority === 'medium' ? '#FF9500' : '#34C759'
              }]} />
              <View style={styles.requestContent}>
                <Text style={styles.requestTitle}>{req.title}</Text>
                <Text style={styles.requestMeta}>
                  {req.status} {req.priority ? `- ${req.priority} priority` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => Alert.alert('Pay Rent', 'Rent payment will be available soon.')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Pay Rent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Report Issue', 'Maintenance request submission will be available soon.')}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionLabel}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('View Lease', 'Lease details coming soon.')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>View Lease</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Join Property', 'Enter a property code from your landlord to join a property.')}
          >
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionLabel}>Join Property</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.actionsGrid, { marginTop: 8 }]}> 
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Messaging')}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('SpecialistDirectory')}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>Specialists</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ProfileSettings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#007AFF22',
  },
  tabText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#007AFF', padding: 20, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderLeftWidth: 4, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#000', textTransform: 'capitalize' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  requestCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  requestContent: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  requestMeta: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 24, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 16, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  actionButtonPrimary: { backgroundColor: '#007AFF' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
  actionLabelPrimary: { color: '#fff' },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8 },
  skeletonLine: { backgroundColor: '#e8e8e8', borderRadius: 4 },
});

export default TenantDashboard;
