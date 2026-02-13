import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

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

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName, []);
      if (error) throw error;
      // Session is set automatically by signUp → RootNavigator renders RoleSelection
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});

export default RegisterScreen;
