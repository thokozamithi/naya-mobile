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

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { user, roles, activeRole, switchRole, signOut, refreshRoles } = useAuth();
  const { subscription, isPro, isExpiringSoon } = useSubscription();

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Roles Section */}
        {roles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Roles</Text>
            <Text style={styles.sectionDescription}>
              Switch between your roles to access different features
            </Text>

            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleCard,
                  activeRole === role && styles.roleCardActive,
                ]}
                onPress={() => switchRole(role)}
              >
                <View style={styles.roleContent}>
                  <Text style={[styles.roleName, activeRole === role && styles.roleNameActive]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                  <Text style={styles.roleDescription}>
                    {getRoleDescription(role)}
                  </Text>
                </View>
                {activeRole === role && (
                  <View style={styles.activeIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subscription Section */}
        {subscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>

            <View style={styles.subscriptionCard}>
              <View>
                <Text style={styles.subscriptionPlan}>
                  {subscription.plan.toUpperCase().replace('_', ' ')}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {subscription.status}
                  {isExpiringSoon && ' (Expiring Soon)'}
                </Text>
              </View>
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            {subscription.expires_at && (
              <View style={styles.expireInfo}>
                <Text style={styles.expireLabel}>Expires:</Text>
                <Text style={styles.expireDate}>
                  {new Date(subscription.expires_at).toLocaleDateString()}
                </Text>
              </View>
            )}

            {isPro && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => Alert.alert('Manage Subscription', 'Subscription management will be available soon.')}
              >
                <Text style={styles.secondaryButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            )}
            {!isPro && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Upgrade' as never)}
              >
                <Text style={styles.buttonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceItem}>
            <View>
              <Text style={styles.preferenceName}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications about updates
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#ccc', true: '#0066cc' }}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleChangePassword}>
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
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
