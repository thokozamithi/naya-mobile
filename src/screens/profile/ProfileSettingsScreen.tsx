import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/services/supabase';
import { DashboardHeader } from '@/components/DashboardHeader';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { user, roles, activeRole, switchRole, signOut, refreshRoles } = useAuth();
  const { subscription, isPro, isExpiringSoon } = useSubscription();
  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          bio: bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      Alert.alert('Password Reset', 'A password reset link has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={user?.email}
        role={activeRole}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              // Navigate back to role-based dashboard
              const roleMap: Record<string, string> = {
                tenant: 'TenantApp',
                landlord: 'LandlordApp',
                builder: 'BuilderApp',
                specialist: 'SpecialistApp',
                employee: 'EmployeeApp',
              };
              const target = roleMap[activeRole as string] || 'TenantApp';
              // Use navigate to top-level app stack
              // @ts-ignore
              navigation.navigate(target);
            }}>
              <Text style={styles.backLink}>← Back to Dashboard</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile Settings</Text>
          </View>

          {/* ...existing code... */
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    tenant: 'View properties and report maintenance issues',
    landlord: 'Manage properties and communicate with tenants',
    employee: 'Track projects and complete work orders',
    builder: 'Create and manage construction projects',
    specialist: 'Offer services and connect with clients',
    admin: 'Platform administration and management',
  };
  return descriptions[role] || '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  backLink: {
    color: '#0066cc',
    fontSize: 14,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 0,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  dangerButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  roleCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0066cc',
  },
  roleContent: {
    flex: 1,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  roleNameActive: {
    color: '#0066cc',
  },
  roleDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeIndicator: {
    backgroundColor: '#0066cc',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subscriptionCard: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#0066cc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPlan: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  subscriptionStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  proBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  expireInfo: {
    marginBottom: 12,
  },
  expireLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  expireDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  spacer: {
    height: 32,
  },
});
