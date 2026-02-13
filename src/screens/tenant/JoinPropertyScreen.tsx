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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

export default function JoinPropertyScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [propertyCode, setPropertyCode] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!propertyCode.trim()) {
      newErrors.propertyCode = 'Property code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoin = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please enter a property code');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to join a property');
      return;
    }

    try {
      setIsLoading(true);

      // Look up property by ID (using property code as ID for now)
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id, name, address, city')
        .eq('id', propertyCode.trim())
        .single();

      if (propError || !property) {
        Alert.alert('Error', 'Property not found. Please check the code and try again.');
        return;
      }

      // Optionally look up unit if unit code provided
      let unitId = null;
      if (unitCode.trim()) {
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select('id')
          .eq('property_id', property.id)
          .eq('unit_code', unitCode.trim())
          .single();

        if (unitError || !unit) {
          Alert.alert('Error', 'Unit not found in this property. Please check the unit code.');
          return;
        }
        unitId = unit.id;
      }

      // Check if already a tenant of this property
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', property.id)
        .single();

      if (existingTenant) {
        Alert.alert('Already Joined', 'You are already a tenant of this property.');
        return;
      }

      // Create tenant record
      const { error: insertError } = await supabase
        .from('tenants')
        .insert({
          user_id: user.id,
          property_id: property.id,
          unit_id: unitId,
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Success',
        `You have joined ${property.name}!`,
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
              Ask your landlord for the property code, then enter it below to join the property and access your unit.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Property Code *</Text>
              <TextInput
                style={[styles.input, errors.propertyCode && styles.inputError]}
                placeholder="Enter property code"
                value={propertyCode}
                onChangeText={setPropertyCode}
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                This is usually a unique ID provided by your landlord
              </Text>
              {errors.propertyCode && (
                <Text style={styles.errorText}>{errors.propertyCode}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 101, A1"
                value={unitCode}
                onChangeText={setUnitCode}
                autoCapitalize="characters"
              />
              <Text style={styles.helperText}>
                If you're renting a specific unit, enter the unit code here
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Property</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Tip</Text>
            <Text style={styles.tipText}>
              Once you join a property, you'll be able to submit maintenance requests, view your lease, and communicate with your landlord.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
});
