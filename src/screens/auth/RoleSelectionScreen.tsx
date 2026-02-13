import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

const allRoles = [
  { id: 'tenant', label: 'Tenant', icon: '🏠', description: 'Find and manage your rental' },
  { id: 'landlord', label: 'Landlord', icon: '🏢', description: 'Manage properties and tenants' },
  { id: 'builder', label: 'Builder', icon: '🔨', description: 'Track construction projects' },
  { id: 'specialist', label: 'Specialist', icon: '🔧', description: 'Offer professional services' },
  { id: 'employee', label: 'Employee', icon: '📊', description: 'Manage work orders and tasks' },
];

const RoleSelectionScreen = ({ navigation }: any) => {
  const { roles: userRoles, addRole, switchRole, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (roleId: string) => {
    setLoading(true);
    try {
      const { error: addError } = await addRole(roleId as any);
      if (addError) throw addError;
      // switchRole is synchronous (updates context) but we'll await a tick to let context propagate
      switchRole(roleId as any);
      // Navigate into the role's app stack so back behavior matches spec
      const roleMap: Record<string, string> = {
        tenant: 'TenantApp',
        landlord: 'LandlordApp',
        builder: 'BuilderApp',
        specialist: 'SpecialistApp',
        employee: 'EmployeeApp',
      };
      const target = roleMap[roleId] || 'TenantApp';
      navigation.navigate(target);
    } catch (err: any) {
      Alert.alert('Role Error', err?.message || 'Could not set role');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const isExistingRole = (roleId: string) => userRoles.includes(roleId as any);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {userRoles.length > 0 && (
        <Text style={styles.sectionLabel}>Your Roles</Text>
      )}

      <FlatList
        data={allRoles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const existing = isExistingRole(item.id);
          return (
            <TouchableOpacity
              style={[styles.roleButton, existing && styles.roleButtonExisting]}
              onPress={() => handleRoleSelect(item.id)}
              disabled={loading}
            >
              <Text style={styles.roleIcon}>{item.icon}</Text>
              <View style={styles.roleInfo}>
                <Text style={styles.roleText}>{item.label}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>
              <Text style={[styles.roleAction, existing && styles.roleActionExisting]}>
                {existing ? 'Switch' : 'Create'}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  roleButtonExisting: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  roleIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  roleInfo: {
    flex: 1,
  },
  roleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  roleDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  roleAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28A745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
    overflow: 'hidden',
  },
  roleActionExisting: {
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
});

export default RoleSelectionScreen;
