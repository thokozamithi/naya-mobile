import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { 
  useMembership, 
  useSubscription, 
  useUserProfile, 
  useLeaveUnit,
  useTenantLease,
  useTenantMaintenanceRequests 
} from '@/hooks/useQueries';

const TABS = [
  'Overview', 'Maintenance', 'Lease', 'Messages'
];

const TenantDashboard = ({ navigation }: any) => {
  const { user, signOut, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Use the new comprehensive membership hook
  const { 
    isJoined, 
    activeProperty, 
    activeUnit, 
    tenantId,
    isLoading: membershipLoading, 
    refreshMembership 
  } = useMembership();
  
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { profile } = useUserProfile();
  const { data: requests = [], isLoading: reqLoading } = useTenantMaintenanceRequests();
  const { data: lease, isLoading: leaseLoading } = useTenantLease();
  const leaveUnit = useLeaveUnit();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMembership();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refreshMembership]);

  const handleLeaveUnit = async () => {
    try {
      await leaveUnit.mutateAsync();
      setShowLeaveModal(false);
      Alert.alert('Success', 'You have left the unit. You can join another property at any time.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to leave unit');
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending' || r.status === 'open');
  const isLoading = membershipLoading || subscriptionLoading || reqLoading;

  return (
    <View style={styles.root}>
      <DashboardHeader
        onLogoPress={() => navigation.navigate('Home')}
        onRoleSwitch={() => navigation.navigate('RoleSelection')}
        onSignOut={() => { signOut(); navigation.navigate('Home'); }}
        userName={profile?.full_name || user?.email}
        role={activeRole || undefined}
      />
      {/* Tab triggers */}
      <View style={styles.tabBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabBarContent}
        >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
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

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <>
          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#007AFF' }]}>
              <Text style={styles.kpiValue}>
                {isLoading ? '-' : isJoined ? 'Active' : 'Not Joined'}
              </Text>
              <Text style={styles.kpiLabel}>Status</Text>
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

          {/* My Property Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Property</Text>
              {isJoined && activeProperty && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => navigation.navigate('PaymentHistory')}
                >
                  <Text style={styles.linkButtonText}>View Payments</Text>
                </TouchableOpacity>
              )}
            </View>
            {membershipLoading ? (
              <View style={styles.skeletonCard}>
                <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
                <View style={[styles.skeletonLine, { width: '80%', height: 12, marginTop: 8 }]} />
              </View>
            ) : !isJoined || !activeProperty ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏠</Text>
                <Text style={styles.emptyText}>Not linked to a property</Text>
                <Text style={styles.emptySubtext}>Join a property to see details here</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('JoinProperty')}
                >
                  <Text style={styles.emptyButtonText}>Join Property</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.propertyCard}
                onPress={() => navigation.navigate('PropertyDetail', { propertyId: activeProperty.id })}
              >
                <View style={styles.propertyCardContent}>
                  <Text style={styles.propertyName}>{activeProperty.name}</Text>
                  <Text style={styles.propertyAddress}>
                    {activeProperty.address}, {activeProperty.city}
                  </Text>
                  {activeUnit && (
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>Unit: {activeUnit.unit_name}</Text>
                      {activeUnit.monthly_rent && (
                        <Text style={styles.rentText}>${activeUnit.monthly_rent}/mo</Text>
                      )}
                    </View>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
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
                <TouchableOpacity
                  key={req.id}
                  style={styles.requestCard}
                  onPress={() => navigation.navigate('MaintenanceRequestDetail', { request: req })}
                >
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
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {isJoined ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => navigation.navigate('PayRent')}
                  >
                    <Text style={styles.actionIcon}>💳</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Pay Rent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CreateMaintenanceRequest', {
                      propertyId: activeProperty?.id,
                      unitId: activeUnit?.id,
                      propertyName: activeProperty?.name
                    })}
                  >
                    <Text style={styles.actionIcon}>🔧</Text>
                    <Text style={styles.actionLabel}>Report Issue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setActiveTab('Lease')}
                  >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionLabel}>View Lease</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => setShowLeaveModal(true)}
                  >
                    <Text style={styles.actionIcon}>🚪</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Leave Unit</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => navigation.navigate('JoinProperty')}
                  >
                    <Text style={styles.actionIcon}>🏠</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Join Property</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { opacity: 0.5 }]}
                    disabled
                  >
                    <Text style={styles.actionIcon}>💳</Text>
                    <Text style={styles.actionLabel}>Pay Rent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { opacity: 0.5 }]}
                    disabled
                  >
                    <Text style={styles.actionIcon}>🔧</Text>
                    <Text style={styles.actionLabel}>Report Issue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { opacity: 0.5 }]}
                    disabled
                  >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionLabel}>View Lease</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={[styles.actionsGrid, { marginTop: 8 }]}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('Messages')}>
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
        </>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'Maintenance' && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Maintenance Requests</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateMaintenanceRequest', {})}
              >
                <Text style={styles.addButtonText}>+ Report Issue</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              [1, 2, 3].map((i) => (
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
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('CreateMaintenanceRequest', {})}
                >
                  <Text style={styles.emptyButtonText}>Report Issue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              requests.map((req: any) => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.requestCard}
                  onPress={() => navigation.navigate('MaintenanceRequestDetail', { request: req })}
                >
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
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      {/* Messages Tab */}
      {activeTab === 'Messages' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Messages coming soon</Text>
              <Text style={styles.emptySubtext}>Direct messaging will be available in a future update</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Messaging')}
              >
                <Text style={styles.emptyButtonText}>Go to Messages</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexGrow: 0,
    flexShrink: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
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
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#000', textTransform: 'capitalize' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  linkButton: { paddingHorizontal: 8, paddingVertical: 4 },
  linkButtonText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  requestContent: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  requestMeta: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 4, marginBottom: 16 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  propertyCardContent: { flex: 1 },
  propertyName: { fontSize: 16, fontWeight: '600', color: '#000' },
  propertyAddress: { fontSize: 13, color: '#666', marginTop: 2 },
  unitBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  unitBadgeText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  rentText: { fontSize: 13, color: '#34C759', fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButtonPrimary: { backgroundColor: '#007AFF' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
  actionLabelPrimary: { color: '#fff' },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8 },
  skeletonLine: { backgroundColor: '#e8e8e8', borderRadius: 4 },
});

export default TenantDashboard;
