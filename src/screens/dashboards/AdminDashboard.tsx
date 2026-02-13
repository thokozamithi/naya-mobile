import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

type Tab = 'pending' | 'subscriptions' | 'memberships' | 'analytics';

export default function AdminDashboard() {
  const navigation = useNavigation();
  const { user, signOut, activeRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [refreshing, setRefreshing] = useState(false);

  // Verify admin server-side
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending subscriptions
  const { data: pendingSubs = [], isLoading: subsLoading } = useQuery({
    queryKey: ['admin-pending-subs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  // Fetch all subscriptions
  const { data: allSubs = [] } = useQuery({
    queryKey: ['admin-all-subs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: async (subId: string) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', expires_at: expiresAt.toISOString() })
        .eq('id', subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-subs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subs'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-subs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-subs'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-pending-subs'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-all-subs'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleApprove = (subId: string) => {
    Alert.alert('Approve', 'Approve this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => approveMutation.mutate(subId) },
    ]);
  };

  const handleReject = (subId: string) => {
    Alert.alert('Reject', 'Reject this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(subId) },
    ]);
  };

  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

  if (adminLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={user?.email}
        role={activeRole}
      />
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingSubs.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeSubs.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{allSubs.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {activeTab === 'pending' && (
          subsLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} size="large" color="#007AFF" />
          ) : pendingSubs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending approvals</Text>
            </View>
          ) : (
            pendingSubs.map((sub: any) => (
              <View key={sub.id} style={styles.subCard}>
                <Text style={styles.subPlan}>{sub.plan?.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.subMeta}>
                  {sub.payment_method} - ${sub.amount}
                </Text>
                <Text style={styles.subDate}>
                  {new Date(sub.created_at).toLocaleDateString()}
                </Text>
                <View style={styles.subActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(sub.id)}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(sub.id)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {activeTab === 'subscriptions' && (
          allSubs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No subscriptions</Text>
            </View>
          ) : (
            allSubs.map((sub: any) => (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subRow}>
                  <Text style={styles.subPlan}>{sub.plan?.replace('_', ' ').toUpperCase()}</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: sub.status === 'active' ? '#d4edda' :
                      sub.status === 'pending' ? '#fff3cd' : '#f8d7da'
                  }]}>\n+                    <Text style={[styles.statusText, {
                      color: sub.status === 'active' ? '#28a745' :
                        sub.status === 'pending' ? '#856404' : '#d32f2f'
                    }]}>{sub.status}</Text>
                  </View>
                </View>
                <Text style={styles.subMeta}>${sub.amount} - {sub.payment_method}</Text>
              </View>
            ))
          )
        )}

        {activeTab === 'memberships' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Membership management coming soon</Text>
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Analytics coming soon</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
                <Text style={styles.subMeta}>${sub.amount} - {sub.payment_method}</Text>
              </View>
            ))
          )
        )}

        {activeTab === 'memberships' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Membership management coming soon</Text>
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Analytics coming soon</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#333', padding: 20, paddingTop: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  signOutText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#007AFF' },
  content: { flex: 1 },
  subCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subPlan: { fontSize: 15, fontWeight: '600', color: '#000' },
  subMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  subDate: { fontSize: 12, color: '#999', marginTop: 2 },
  subActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: { flex: 1, backgroundColor: '#28a745', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rejectBtn: { flex: 1, backgroundColor: '#f8d7da', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#d32f2f', fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  errorText: { fontSize: 18, fontWeight: '600', color: '#d32f2f', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#999', marginBottom: 16 },
  backButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
});
