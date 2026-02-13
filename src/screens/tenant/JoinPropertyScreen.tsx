import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function JoinPropertyScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!joinCode.trim()) {
      newErrors.joinCode = 'Unit join code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    
    // Try to parse JSON format (for future-proofing)
    try {
      const parsed = JSON.parse(data);
      if (parsed.unit_join_code) {
        setJoinCode(parsed.unit_join_code);
        Alert.alert('QR Code Scanned', `Code: ${parsed.unit_join_code}`, [{ text: 'OK' }]);
        return;
      }
      if (parsed.joinCode) {
        setJoinCode(parsed.joinCode);
        Alert.alert('QR Code Scanned', `Code: ${parsed.joinCode}`, [{ text: 'OK' }]);
        return;
      }
    } catch {
      // Not JSON, treat as raw code
    }
    
    // Handle plain code string
    setJoinCode(data.trim().toUpperCase());
    Alert.alert('QR Code Scanned', `Code: ${data}`, [{ text: 'OK' }]);
  };

  const openScanner = async () => {
    if (!permission || !permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
        return;
      }
    }

    setShowScanner(true);
  };

  const handleJoin = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please enter the unit join code');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to join a property');
      return;
    }

    try {
      setIsLoading(true);

      // Call RPC function to join unit
      const { data, error } = await supabase.rpc('join_unit_by_code', {
        p_code: joinCode.trim().toUpperCase()
      });

      if (error) {
        console.error('RPC error:', error);
        Alert.alert('Error', error.message || 'Failed to join property');
        return;
      }

      const result = data as { success: boolean; error?: string; property_name?: string; property_id?: string };

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to join property');
        return;
      }

      // Invalidate relevant queries so landlord and tenant dashboards update
      queryClient.invalidateQueries({ queryKey: ['tenant-property'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (result.property_id) {
        queryClient.invalidateQueries({ queryKey: ['units', result.property_id] });
        queryClient.invalidateQueries({ queryKey: ['property', result.property_id] });
      }

      Alert.alert(
        'Success',
        `You have joined ${result.property_name}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error joining property:', error);
      Alert.alert('Error', error.message || 'Failed to join property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Property</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🏠</Text>
            <Text style={styles.infoTitle}>Get Connected</Text>
            <Text style={styles.infoText}>
              Ask your landlord for your unit's join code, then enter it below or scan the QR code to join.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit Join Code *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputWithButton, errors.joinCode && styles.inputError]}
                  placeholder="Enter code (e.g., ABC1234)"
                  value={joinCode}
                  onChangeText={(text) => setJoinCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={openScanner}
                >
                  <Text style={styles.scanButtonText}>📷 Scan</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Enter the 7-character code provided by your landlord
              </Text>
              {errors.joinCode && (
                <Text style={styles.errorText}>{errors.joinCode}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Unit</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Tip</Text>
            <Text style={styles.tipText}>
              Once you join, you'll be able to submit maintenance requests, view your lease, and communicate with your landlord.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Unit QR Code</Text>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Text style={styles.scannerCloseButton}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstructions}>
              Position the unit's QR code within the frame
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputWithButton: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tipBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scannerCloseButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
