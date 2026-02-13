import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useMaintenanceRequests } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';

const EmployeeDashboard = ({ navigation }: any) => {
  const { user } = useAuth();
  const { projects = [], isLoading: projLoading } = useProjects();
  const { data: requests = [], isLoading: reqLoading } = useMaintenanceRequests(user?.id);
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const pendingTasks = requests.filter((r: any) => r.status === 'assigned' || r.status === 'in-progress');
  const isLoading = projLoading || reqLoading;

  return (
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
        <View style={[styles.kpiCard, { borderLeftColor: '#5AC8FA' }]}>
          <Text style={styles.kpiValue}>{isLoading ? '-' : pendingTasks.length}</Text>
          <Text style={styles.kpiLabel}>Assigned Tasks</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
          <Text style={styles.kpiValue}>{isLoading ? '-' : projects.length}</Text>
          <Text style={styles.kpiLabel}>Projects</Text>
        </View>
      </View>

      {/* Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Tasks</Text>
        {isLoading ? (
          [1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
            </View>
          ))
        ) : pendingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No assigned tasks</Text>
            <Text style={styles.emptySubtext}>Tasks assigned to you will appear here</Text>
          </View>
        ) : (
          pendingTasks.slice(0, 5).map((task: any) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={[styles.priorityDot, {
                backgroundColor: task.priority === 'high' ? '#FF3B30' :
                  task.priority === 'medium' ? '#FF9500' : '#34C759'
              }]} />
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>{task.status} - {task.priority} priority</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#5AC8FA', padding: 20, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  kpiValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  taskMeta: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
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
