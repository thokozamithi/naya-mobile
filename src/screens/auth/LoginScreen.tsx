import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
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
                <TouchableOpacity style={[styles.tabButton, styles.tabActive]} disabled>
                  <Text style={styles.tabTextActive}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton} onPress={() => { setForgotMode(false); navigation.navigate('Register'); }}>
                  <Text style={styles.tabText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {resetSent
                  ? 'Check your email for a password reset link.'
                  : 'Enter your email to receive a reset link.'}
              </Text>

              {!resetSent && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleForgotPassword}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={() => { setForgotMode(false); setResetSent(false); }}>
                <Text style={styles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity onPress={() => navigation.navigate('Landing')}>
              <Text style={styles.backLink}>← Back to Home</Text>
            </TouchableOpacity>
            <View style={styles.logoRow}><Text style={styles.logo}>N</Text></View>
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tabButton, styles.tabActive]} disabled>
                <Text style={styles.tabTextActive}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.tabText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Naya Central</Text>
            <Text style={styles.subtitle}>Welcome Back</Text>

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

            <TouchableOpacity onPress={() => setForgotMode(true)}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Don't have an account? Sign up</Text>
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
    fontSize: 32,
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
  forgotLink: {
    color: '#007AFF',
    textAlign: 'right',
    fontSize: 13,
    marginBottom: 5,
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  backLink: {
    color: '#007AFF',
    fontSize: 14,
    marginBottom: 12,
  },
});

export default LoginScreen;
