import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, UserRole } from '@/hooks/useAuth';

const ROLE_OPTIONS: { id: UserRole; label: string }[] = [
  { id: 'tenant', label: 'Tenant' },
  { id: 'landlord', label: 'Landlord' },
  { id: 'employee', label: 'Employee' },
  { id: 'builder', label: 'Builder' },
  { id: 'specialist', label: 'Specialist' },
];

const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');
  const [tenantJoinCode, setTenantJoinCode] = useState('');
  const [employeeLandlordId, setEmployeeLandlordId] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const buildErrorMessage = (result: { error: Error | null; stage?: string; details?: any }) => {
    const base = result.error?.message || 'Registration failed.';
    const lines: string[] = [];
    if (result.stage) lines.push(`Stage: ${result.stage}`);
    if (result.details?.code) lines.push(`Code: ${result.details.code}`);
    if (result.details?.details) lines.push(`Details: ${result.details.details}`);
    if (result.details?.hint) lines.push(`Hint: ${result.details.hint}`);
    return lines.length > 0 ? `${base}\n\n${lines.join('\n')}` : base;
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (selectedRole === 'tenant' && !tenantJoinCode.trim()) {
      Alert.alert('Missing Join Code', 'Tenant registration requires a unit join code.');
      return;
    }

    if (selectedRole === 'employee' && !employeeLandlordId.trim()) {
      Alert.alert('Missing Landlord ID', 'Employee registration requires a landlord ID.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, fullName, [selectedRole], {
        tenantJoinCode: tenantJoinCode.trim() || undefined,
        employeeLandlordId: employeeLandlordId.trim() || undefined,
      });

      if (result.error) {
        Alert.alert('Registration Error', buildErrorMessage(result));
        return;
      }

      if (result.needsEmailConfirmation) {
        Alert.alert(
          'Check Your Email',
          'We\'ve sent a confirmation link to your email address. Please click the link to verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Account Created',
        'Your account is ready. You can sign in now.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Registration Error', error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoRow}><Text style={styles.logo}>N</Text></View>
            <View style={styles.tabRow}>
              <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.tabText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, styles.tabActive]} disabled>
                <Text style={styles.tabTextActive}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Naya Central</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name (optional)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <Text style={styles.roleLabel}>Select Role</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.roleChip, selectedRole === role.id && styles.roleChipActive]}
                  onPress={() => setSelectedRole(role.id)}
                  disabled={loading}
                >
                  <Text style={[styles.roleChipText, selectedRole === role.id && styles.roleChipTextActive]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedRole === 'tenant' && (
              <TextInput
                style={styles.input}
                placeholder="Unit Join Code"
                value={tenantJoinCode}
                onChangeText={setTenantJoinCode}
                autoCapitalize="characters"
                editable={!loading}
              />
            )}

            {selectedRole === 'employee' && (
              <TextInput
                style={styles.input}
                placeholder="Landlord ID"
                value={employeeLandlordId}
                onChangeText={setEmployeeLandlordId}
                autoCapitalize="none"
                editable={!loading}
              />
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 40,
    },
    logoRow: {
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 2,
    },
    tabRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 18,
      gap: 8,
    },
    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      backgroundColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: '#007AFF',
    },
    tabText: {
      color: '#007AFF',
      fontWeight: '600',
      fontSize: 16,
    },
    tabTextActive: {
      color: '#007AFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  roleChipActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF22',
  },
  roleChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#007AFF',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});

export default RegisterScreen;
