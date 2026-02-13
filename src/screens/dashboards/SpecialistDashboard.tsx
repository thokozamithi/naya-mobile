import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useData';
import { useUserProfile } from '@/hooks/useQueries';
import { DashboardHeader } from '@/components/DashboardHeader';

const SpecialistDashboard = ({ navigation }: any) => {
  const { user, signOut, activeRole } = useAuth();
  const { profile } = useUserProfile();
  const { data: messages = [], isLoading } = useMessages(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const unreadMessages = messages.filter((m: any) => m.receiver_id === user?.id);

  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

  // Quick actions
  const handleDirectory = () => navigation.navigate('SpecialistDirectory');
  const handleSettings = () => navigation.navigate('ProfileSettings');
  const handleMessages = () => navigation.navigate('Messaging');
  const handleEditProfile = () => navigation.navigate('SpecialistRegistration');

  return (
    <>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={profile?.full_name || user?.email}
        role={activeRole}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#AF52DE" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Specialist Dashboard</Text>
          <Text style={styles.subtitle}>{profile?.full_name || user?.email}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#AF52DE' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : '0'}</Text>
            <Text style={styles.kpiLabel}>Active Jobs</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#34C759' }]}>
            <Text style={styles.kpiValue}>{isLoading ? '-' : unreadMessages.length}</Text>
            <Text style={styles.kpiLabel}>Messages</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.infoValue}>Available</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessages}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDirectory}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionLabel}>Directory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
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
  header: { backgroundColor: '#AF52DE', padding: 20, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  kpiValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { paddingHorizontal: 12, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, marginBottom: 10 },
  infoLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#000' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  primaryButton: { backgroundColor: '#AF52DE', borderRadius: 10, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
});

export default SpecialistDashboard;
