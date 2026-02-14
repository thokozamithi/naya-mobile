import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeProjects, useAssignedMaintenanceRequests, useUpdateProject, useAddProjectNote } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';
import { DashboardHeader } from '@/components/DashboardHeader';

const EmployeeDashboard = ({ navigation }: any) => {
  const { user, signOut, activeRole } = useAuth();
  const { data: projects = [], isLoading: projLoading, refetch } = useEmployeeProjects();
  const { data: maintRequests = [], isLoading: maintLoading } = useAssignedMaintenanceRequests();
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
  const updateProject = useUpdateProject();
  const addProjectNote = useAddProjectNote();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeProjects = projects.filter((p: any) => p.status === 'in_progress');
  const pendingProjects = projects.filter((p: any) => p.status === 'pending');
  const activeMaintRequests = maintRequests.filter((r: any) => !['completed', 'cancelled'].includes(r.status));
  const isLoading = projLoading || maintLoading;

  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

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

  const getAuthorRole = (role: string | null | undefined) => {
    if (role === 'landlord') return 'landlord';
    if (role === 'employee') return 'employee';
    if (role === 'tenant') return 'tenant';
    return 'system';
  };

  const handleQuickStatus = async (project: any, nextStatus: string) => {
    setUpdatingProjectId(project.id);
    try {
      await updateProject.mutateAsync({ id: project.id, status: nextStatus });
      await addProjectNote.mutateAsync({
        project_id: project.id,
        author_role: getAuthorRole(activeRole),
        body: `Status changed to ${nextStatus.replace('_', ' ')}`,
      });
    } catch (err) {
      console.error('[EmployeeDashboard] Quick status update failed:', err);
    } finally {
      setUpdatingProjectId(null);
    }
  };

  return (
    <>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={profile?.full_name || user?.email}
        role={activeRole || undefined}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5AC8FA" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Employee Dashboard</Text>
          <Text style={styles.subtitle}>{profile?.full_name || user?.email}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#FF9500' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : activeProjects.length}</Text>
            <Text style={styles.kpiLabel}>Active Projects</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#FF3B30' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : activeMaintRequests.length}</Text>
            <Text style={styles.kpiLabel}>Work Orders</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : projects.length + maintRequests.length}</Text>
            <Text style={styles.kpiLabel}>Total Tasks</Text>
          </View>
        </View>

        {/* Projects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Jobs</Text>
          {isLoading ? (
            [1, 2].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
              </View>
            ))
          ) : projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No assigned projects</Text>
              <Text style={styles.emptySubtext}>Projects assigned to you will appear here</Text>
            </View>
          ) : (
            projects.slice(0, 10).map((project: any) => (
              <TouchableOpacity
                key={project.id}
                style={styles.taskCard}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(project.priority) }]} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{project.title}</Text>
                  <Text style={styles.taskMeta}>
                    {project.property?.name ? `${project.property.name} • ` : ''}{project.priority} priority
                  </Text>
                  <View style={styles.projectStatusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(project.status) }]}>
                        {project.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.progressMini}>
                      <View style={[styles.progressMiniBar, { width: `${project.progress}%`, backgroundColor: getStatusColor(project.status) }]} />
                    </View>
                    <Text style={styles.progressMiniText}>{project.progress}%</Text>
                  </View>
                  <View style={styles.quickActionsRow}>
                    {project.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => handleQuickStatus(project, 'in_progress')}
                        disabled={updatingProjectId === project.id}
                      >
                        {updatingProjectId === project.id ? (
                          <ActivityIndicator size="small" color="#0066cc" />
                        ) : (
                          <Text style={styles.quickButtonText}>Start</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {project.status === 'in_progress' && (
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => handleQuickStatus(project, 'completed')}
                        disabled={updatingProjectId === project.id}
                      >
                        {updatingProjectId === project.id ? (
                          <ActivityIndicator size="small" color="#0066cc" />
                        ) : (
                          <Text style={styles.quickButtonText}>Complete</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Assigned Maintenance Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Work Orders</Text>
          {maintLoading ? (
            [1, 2].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
              </View>
            ))
          ) : maintRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyText}>No work orders assigned</Text>
              <Text style={styles.emptySubtext}>Maintenance requests assigned to you will appear here</Text>
            </View>
          ) : (
            maintRequests.slice(0, 10).map((request: any) => (
              <TouchableOpacity
                key={request.id}
                style={styles.taskCard}
                onPress={() => navigation.navigate('MaintenanceRequestDetail', { request })}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: request.priority === 'high' ? '#FF3B30' : request.priority === 'medium' ? '#FF9500' : '#34C759' }]} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{request.title}</Text>
                  <Text style={styles.taskMeta}>
                    {request.work_order_code} • {request.status.replace('_', ' ')}
                  </Text>
                  <Text style={styles.taskSubText} numberOfLines={1}>
                    {request.description}
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
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ThreadMessaging')}>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#5AC8FA', padding: 20, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  taskMeta: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  taskSubText: { fontSize: 12, color: '#999', marginTop: 2 },
  projectStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  progressMini: { flex: 1, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' },
  progressMiniBar: { height: '100%', borderRadius: 2 },
  progressMiniText: { fontSize: 11, fontWeight: '600', color: '#666', minWidth: 28, textAlign: 'right' },
  quickActionsRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  quickButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#0066cc' },
  quickButtonText: { fontSize: 12, fontWeight: '600', color: '#0066cc' },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 24, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8 },
  skeletonLine: { backgroundColor: '#e8e8e8', borderRadius: 4 },
});

export default EmployeeDashboard;
