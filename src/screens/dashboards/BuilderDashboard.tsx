import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';
import { DashboardHeader } from '@/components/DashboardHeader';

const BuilderDashboard = ({ navigation }: any) => {
  const { user, signOut, activeRole } = useAuth();
  const { projects = [], isLoading } = useProjects();
  const { profile } = useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const activeProjects = projects.filter((p: any) => p.status === 'in-progress' || p.status === 'active');
  const completedProjects = projects.filter((p: any) => p.status === 'completed');

  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

  // Quick actions
  const handleSpecialists = () => navigation.navigate('SpecialistDirectory');
  const handleSettings = () => navigation.navigate('ProfileSettings');
  const handleMessages = () => navigation.navigate('Messaging');

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Builder Dashboard</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => Alert.alert('New Project', 'Project creation will be available soon.')}
              >
                <Text style={styles.headerButtonText}>+ New Project</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSpecialists}
              >
                <Text style={styles.headerButtonText}>Specialists</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>{profile?.full_name || user?.email}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#FF9500' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : activeProjects.length}</Text>
            <Text style={styles.kpiLabel}>Active Projects</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : completedProjects.length}</Text>
            <Text style={styles.kpiLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessages}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSpecialists}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionLabel}>Specialists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#007AFF' }]}>
          <Text style={styles.kpiValue}>{isLoading ? '-' : projects.length}</Text>
          <Text style={styles.kpiLabel}>Total Projects</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#AF52DE' }]}>
            <Text style={styles.kpiValue}>
              {isLoading ? '-' : activeProjects.length > 0
                ? Math.round(activeProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / activeProjects.length) + '%'
                : '0%'}
            </Text>
            <Text style={styles.kpiLabel}>Avg Progress</Text>
          </View>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Projects</Text>
        {isLoading ? (
          [1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 8 }]} />
            </View>
          ))
        ) : projects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔨</Text>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Projects you create will appear here</Text>
          </View>
        ) : (
          projects.slice(0, 5).map((project: any) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            >
              <View style={styles.projectCardContent}>
                <Text style={styles.projectName}>{project.title}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${project.progress || 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{project.progress || 0}%</Text>
                </View>
                <View style={styles.projectMeta}>
                  <View style={[styles.statusBadge, {
                    backgroundColor: project.status === 'completed' ? '#d4edda' :
                      project.status === 'in-progress' ? '#fff3cd' : '#e8f4ff'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: project.status === 'completed' ? '#28a745' :
                        project.status === 'in-progress' ? '#856404' : '#007AFF'
                    }]}>{project.status}</Text>
                  </View>
                  {project.budget && <Text style={styles.budget}>${project.budget.toLocaleString()}</Text>}
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

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
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF9500', padding: 20, paddingTop: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  headerButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  kpiValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  projectCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  projectCardContent: { flex: 1 },
  projectName: { fontSize: 16, fontWeight: '600', color: '#000' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#FF9500', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#666', width: 35 },
  projectMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  budget: { fontSize: 12, fontWeight: '600', color: '#28A745' },
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

export default BuilderDashboard;
