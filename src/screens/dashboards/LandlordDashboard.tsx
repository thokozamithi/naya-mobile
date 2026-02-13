import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState as useReactState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useMaintenanceRequests } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';

const TABS = [
  'Overview', 'Properties', 'Maintenance', 'Messages'
];

const LandlordDashboard = ({ navigation }: any) => {
    const { signOut, activeRole } = useAuth();
    const [activeTab, setActiveTab] = useReactState('Overview');
  const { user } = useAuth();
  const { properties = [], isLoading: propsLoading } = useProperties();
  const { data: requests = [], isLoading: reqLoading } = useMaintenanceRequests(user?.id);
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // React Query will refetch automatically
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const pendingRequests = requests.filter((r: any) => r.status === 'pending' || r.status === 'open');
  const totalUnits = properties.reduce((sum: number, p: any) => sum + (p.total_units || 0), 0);

  const isLoading = propsLoading || reqLoading;

  return (
    <>
      <DashboardHeader
        onLogoPress={() => navigation.navigate('Home')}
        onRoleSwitch={() => navigation.navigate('RoleSelection')}
        onSignOut={() => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); }}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Landlord Dashboard</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('SpecialistDirectory')}
            >
              <Text style={styles.headerButtonText}>Find Specialists</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {profile?.full_name || user?.email}
          </Text>
        </View>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <>
          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#007AFF' }]}>
              <Text style={styles.kpiValue}>
                {isLoading ? '-' : properties.length}
              </Text>
              <Text style={styles.kpiLabel}>Properties</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
              <Text style={styles.kpiValue}>
                {isLoading ? '-' : totalUnits}
              </Text>
              <Text style={styles.kpiLabel}>Total Units</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#FF9500' }]}>
              <Text style={styles.kpiValue}>
                {isLoading ? '-' : pendingRequests.length}
              </Text>
              <Text style={styles.kpiLabel}>Pending Requests</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#AF52DE' }]}>
              <Text style={styles.kpiValue}>
                {isLoading ? '-' : requests.length}
              </Text>
              <Text style={styles.kpiLabel}>All Requests</Text>
            </View>
          </View>

          {/* Properties List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Properties</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddProperty')}
              >
                <Text style={styles.addButtonText}>+ Add Property</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              [1, 2].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
                  <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
                </View>
              ))
            ) : properties.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No properties yet</Text>
                <Text style={styles.emptySubtext}>Add your first property to get started</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddProperty')}
                >
                  <Text style={styles.emptyButtonText}>Add Property</Text>
                </TouchableOpacity>
              </View>
            ) : (
              properties.slice(0, 5).map((property: any) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.propertyCard}
                  onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}
                >
                  <View style={styles.propertyCardContent}>
                    <Text style={styles.propertyName}>{property.name}</Text>
                    <Text style={styles.propertyAddress}>
                      {property.address}, {property.city}
                    </Text>
                    <View style={styles.propertyMeta}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{property.property_type}</Text>
                      </View>
                      <Text style={styles.unitCount}>{property.total_units} units</Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recent Maintenance Requests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Maintenance</Text>
            {isLoading ? (
              <View style={styles.skeletonCard}>
                <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '70%', height: 12, marginTop: 8 }]} />
              </View>
            ) : pendingRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            ) : (
              pendingRequests.slice(0, 3).map((req: any) => (
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
                    <Text style={styles.requestStatus}>{req.status}</Text>
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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Messaging')}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionLabel}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('SpecialistDirectory')}
              >
                <Text style={styles.actionIcon}>🔍</Text>
                <Text style={styles.actionLabel}>Specialists</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ProfileSettings')}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionLabel}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Properties Tab */}
      {activeTab === 'Properties' && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Properties</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddProperty')}
              >
                <Text style={styles.addButtonText}>+ Add Property</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
                  <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
                </View>
              ))
            ) : properties.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No properties yet</Text>
                <Text style={styles.emptySubtext}>Add your first property to get started</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddProperty')}
                >
                  <Text style={styles.emptyButtonText}>Add Property</Text>
                </TouchableOpacity>
              </View>
            ) : (
              properties.map((property: any) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.propertyCard}
                  onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}
                >
                  <View style={styles.propertyCardContent}>
                    <Text style={styles.propertyName}>{property.name}</Text>
                    <Text style={styles.propertyAddress}>
                      {property.address}, {property.city}
                    </Text>
                    <View style={styles.propertyMeta}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{property.property_type}</Text>
                      </View>
                      <Text style={styles.unitCount}>{property.total_units} units</Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'Maintenance' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Maintenance Requests</Text>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
                  <View style={[styles.skeletonLine, { width: '70%', height: 12, marginTop: 8 }]} />
                </View>
              ))
            ) : requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyText}>No maintenance requests</Text>
                <Text style={styles.emptySubtext}>Requests will appear here when created</Text>
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
                    <Text style={styles.requestStatus}>{req.status}</Text>
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
  header: { backgroundColor: '#34C759', padding: 20, paddingTop: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  headerButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderLeftWidth: 4, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  kpiValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  sectionCount: { fontSize: 14, color: '#666', backgroundColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  propertyCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  propertyCardContent: { flex: 1 },
  propertyName: { fontSize: 16, fontWeight: '600', color: '#000' },
  propertyAddress: { fontSize: 13, color: '#666', marginTop: 2 },
  propertyMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  badge: { backgroundColor: '#E8F4FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#007AFF', fontWeight: '600' },
  unitCount: { fontSize: 12, color: '#666' },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  requestCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  requestContent: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  requestStatus: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 24, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 4, marginBottom: 16 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 16, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
  skeletonCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8,
  },
  skeletonLine: { backgroundColor: '#e8e8e8', borderRadius: 4 },
});

export default LandlordDashboard;
