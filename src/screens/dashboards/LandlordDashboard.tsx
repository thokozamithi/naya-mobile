import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useState as useReactState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useMaintenanceRequests, useLandlordConversations, useLandlordProjects, useLandlordEmployees } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';
import { formatTime } from '@/lib/utils';

const TABS = [
  'Overview', 'Properties', 'Projects', 'Maintenance', 'Messages'
];

const LandlordDashboard = ({ navigation }: any) => {
    const { signOut, activeRole } = useAuth();
    const [activeTab, setActiveTab] = useReactState('Overview');
  const { user } = useAuth();
  const { properties = [], isLoading: propsLoading } = useProperties();
  const { data: requests = [], isLoading: reqLoading } = useMaintenanceRequests(user?.id);
  const { data: conversations = [], isLoading: convLoading } = useLandlordConversations();
  const { data: projects = [], isLoading: projLoading } = useLandlordProjects();
  const { data: employees = [], isLoading: empLoading } = useLandlordEmployees();
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // React Query will refetch automatically
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const pendingRequests = requests.filter((r: any) => r.status === 'pending' || r.status === 'open');
  const totalUnits = properties.reduce((sum: number, p: any) => sum + (p.total_units || 0), 0);

  const isLoading = propsLoading || reqLoading || convLoading || projLoading;
  const unreadMessageCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const activeProjectCount = projects.filter((p: any) => p.status === 'in_progress').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#FF9500';
      case 'pending': return '#5AC8FA';
      case 'on_hold': return '#FF3B30';
      default: return '#999';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#5AC8FA';
      case 'low': return '#34C759';
      default: return '#999';
    }
  };

  return (
    <View style={styles.root}>
      <DashboardHeader
        onLogoPress={() => navigation.navigate('Home')}
        onRoleSwitch={() => navigation.navigate('RoleSelection')}
        onSignOut={() => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); }}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>Landlord Dashboard</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('SpecialistDirectory')}
            >
              <Text style={[styles.headerButtonText, isCompact && styles.headerButtonTextCompact]}>Find Specialists</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
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
                {isLoading ? '-' : projects.length}
              </Text>
              <Text style={styles.kpiLabel}>Projects</Text>
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
                    backgroundColor: req.priority === 'emergency' || req.priority === 'high' ? '#FF3B30' :
                      req.priority === 'medium' ? '#FF9500' : '#34C759'
                  }]} />
                  <View style={styles.requestContent}>
                    <Text style={styles.requestTitle}>{req.title}</Text>
                    <Text style={styles.requestMeta}>
                      {req.unit?.unit_name || 'No unit'} • {req.tenant?.full_name || req.tenant?.email || 'Unknown tenant'}
                    </Text>
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
                onPress={() => navigation.navigate('CreateProject')}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>New Project</Text>
              </TouchableOpacity>
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

      {/* Projects Tab */}
      {activeTab === 'Projects' && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects ({projects.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateProject')}
              >
                <Text style={styles.addButtonText}>+ New Project</Text>
              </TouchableOpacity>
            </View>

            {projLoading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
                  <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
                </View>
              ))
            ) : projects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No projects yet</Text>
                <Text style={styles.emptySubtext}>Create your first project to track work</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('CreateProject')}
                >
                  <Text style={styles.emptyButtonText}>Create Project</Text>
                </TouchableOpacity>
              </View>
            ) : (
              projects.map((project: any) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.propertyCard}
                  onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                >
                  <View style={styles.propertyCardContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(project.status) + '22' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(project.status) }]}>
                          {project.status.replace('_', ' ')}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: getPriorityColor(project.priority) + '22' }]}>
                        <Text style={[styles.badgeText, { color: getPriorityColor(project.priority) }]}>
                          {project.priority}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.propertyName}>{project.title}</Text>
                    {project.property?.name && (
                      <Text style={styles.propertyAddress}>📍 {project.property.name}</Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                      <View style={{ flex: 1, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${project.progress}%`, backgroundColor: getStatusColor(project.status), borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>{project.progress}%</Text>
                    </View>
                    {project.assignments && project.assignments.length > 0 && (
                      <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        👤 {project.assignments.map((a: any) => a.employee?.full_name || 'Unassigned').join(', ')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Employees Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team ({employees.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddEmployee')}
              >
                <Text style={styles.addButtonText}>+ Add Employee</Text>
              </TouchableOpacity>
            </View>

            {employees.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No team members</Text>
                <Text style={styles.emptySubtext}>Add employees to assign to projects</Text>
              </View>
            ) : (
              employees.map((emp: any) => (
                <View key={emp.id} style={styles.requestCard}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: '#5AC8FA',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12
                  }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                      {(emp.full_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.requestContent}>
                    <Text style={styles.requestTitle}>{emp.full_name}</Text>
                    <Text style={styles.requestMeta}>{emp.email || emp.phone || 'No contact'}</Text>
                    <View style={[styles.statusBadge, {
                      backgroundColor: emp.status === 'active' ? '#E8F8EE' : '#FFF4E5'
                    }]}>
                      <Text style={[styles.statusBadgeText, {
                        color: emp.status === 'active' ? '#34C759' : '#FF9500'
                      }]}>{emp.status}</Text>
                    </View>
                  </View>
                </View>
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
                <Text style={styles.emptySubtext}>Requests from tenants will appear here</Text>
              </View>
            ) : (
              requests.map((req: any) => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.requestCard}
                  onPress={() => navigation.navigate('MaintenanceRequestDetail', { request: req })}
                >
                  <View style={[styles.priorityDot, {
                    backgroundColor: req.priority === 'emergency' || req.priority === 'high' ? '#FF3B30' :
                      req.priority === 'medium' ? '#FF9500' : '#34C759'
                  }]} />
                  <View style={styles.requestContent}>
                    <Text style={styles.requestTitle}>{req.title}</Text>
                    <Text style={styles.requestMeta}>
                      {req.unit?.unit_name || 'No unit'} • {req.tenant?.full_name || req.tenant?.email || 'Unknown tenant'}
                    </Text>
                    <View style={styles.requestStatusRow}>
                      <View style={[styles.statusBadge, {
                        backgroundColor: req.status === 'completed' ? '#E8F8EE' : 
                          req.status === 'in_progress' ? '#FFF4E5' : '#F0F0F0'
                      }]}>
                        <Text style={[styles.statusBadgeText, {
                          color: req.status === 'completed' ? '#34C759' : 
                            req.status === 'in_progress' ? '#FF9500' : '#666'
                        }]}>{req.status.replace('_', ' ')}</Text>
                      </View>
                      <Text style={styles.requestDate}>{formatTime(req.created_at)}</Text>
                    </View>
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
            <Text style={styles.sectionTitle}>
              Conversations {unreadMessageCount > 0 && `(${unreadMessageCount} unread)`}
            </Text>
            {convLoading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: '50%', height: 14 }]} />
                  <View style={[styles.skeletonLine, { width: '70%', height: 12, marginTop: 8 }]} />
                </View>
              ))
            ) : conversations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Messages from tenants will appear here</Text>
              </View>
            ) : (
              conversations.map((conv: any) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.conversationCard}
                  onPress={() => navigation.navigate('Messaging', { conversationId: conv.id, tenantId: conv.tenantId })}
                >
                  <View style={styles.conversationAvatar}>
                    <Text style={styles.conversationAvatarText}>
                      {conv.propertyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationProperty} numberOfLines={1}>
                        {conv.propertyName}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {formatTime(conv.lastMessage.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.conversationUnit}>
                      {conv.unitName || 'General'} • Tenant
                    </Text>
                    <Text style={styles.conversationPreview} numberOfLines={1}>
                      {conv.lastMessage.content}
                    </Text>
                  </View>
                  {conv.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
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
  header: { backgroundColor: '#34C759', padding: 16, paddingTop: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  titleCompact: { fontSize: 20 },
  headerButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  headerButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  headerButtonTextCompact: { fontSize: 10 },
  subtitle: { fontSize: 12, color: '#fff', marginTop: 2, opacity: 0.9 },
  subtitleCompact: { fontSize: 11 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 12, gap: 8 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12,
    borderLeftWidth: 4, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 11, color: '#666', marginTop: 2 },
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
  requestMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  requestStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  requestDate: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  // Conversation styles
  conversationCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  conversationAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  conversationAvatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conversationProperty: { fontSize: 15, fontWeight: '600', color: '#000', flex: 1 },
  conversationTime: { fontSize: 11, color: '#999' },
  conversationUnit: { fontSize: 12, color: '#666', marginTop: 2 },
  conversationPreview: { fontSize: 13, color: '#888', marginTop: 4 },
  unreadBadge: {
    backgroundColor: '#007AFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    marginLeft: 8, minWidth: 20, alignItems: 'center',
  },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#333' },
  skeletonCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8,
  },
  skeletonLine: { backgroundColor: '#e8e8e8', borderRadius: 4 },
});

export default LandlordDashboard;
