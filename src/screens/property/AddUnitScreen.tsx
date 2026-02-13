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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useCreateUnit } from '@/hooks/useData';

const UNIT_STATUSES = [
  { value: 'vacant', label: 'Vacant', color: '#FF9500' },
  { value: 'occupied', label: 'Occupied', color: '#34C759' },
  { value: 'maintenance', label: 'Maintenance', color: '#FF3B30' },
  { value: 'unavailable', label: 'Unavailable', color: '#8E8E93' },
];

interface RouteParams {
  propertyId: string;
  propertyName?: string;
}

export default function AddUnitScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { propertyId, propertyName } = (route.params as RouteParams) || {};

  const createUnit = useCreateUnit();

  const [unitName, setUnitName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [status, setStatus] = useState('vacant');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1.0');
  const [squareFeet, setSquareFeet] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!propertyId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!unitName.trim()) newErrors.unitName = 'Unit name is required';
    if (!unitCode.trim()) newErrors.unitCode = 'Unit code is required';
    if (bedrooms && parseInt(bedrooms) < 0) {
      newErrors.bedrooms = 'Must be 0 or more';
    }
    if (bathrooms && parseFloat(bathrooms) < 0) {
      newErrors.bathrooms = 'Must be 0 or more';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createUnit.mutateAsync({
        property_id: propertyId,
        unit_name: unitName.trim(),
        unit_code: unitCode.trim(),
        status,
        bedrooms: bedrooms ? parseInt(bedrooms) : 1,
        bathrooms: bathrooms ? parseFloat(bathrooms) : 1.0,
        square_feet: squareFeet ? parseInt(squareFeet) : null,
        monthly_rent: monthlyRent ? parseFloat(monthlyRent) : null,
      });

      Alert.alert('Success', 'Unit added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating unit:', error);
      Alert.alert('Error', error.message || 'Failed to create unit');
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
          <Text style={styles.headerTitle}>Add Unit</Text>
          <View style={{ width: 60 }} />
        </View>

        {propertyName && (
          <View style={styles.propertyBanner}>
            <Text style={styles.propertyBannerText}>Adding unit to: {propertyName}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit Name *</Text>
            <TextInput
              style={[styles.input, errors.unitName && styles.inputError]}
              placeholder="e.g. Unit 101, Apartment A"
              value={unitName}
              onChangeText={setUnitName}
            />
            {errors.unitName && <Text style={styles.errorText}>{errors.unitName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit Code *</Text>
            <TextInput
              style={[styles.input, errors.unitCode && styles.inputError]}
              placeholder="e.g. 101, A1"
              value={unitCode}
              onChangeText={setUnitCode}
            />
            <Text style={styles.helperText}>Unique identifier for this unit</Text>
            {errors.unitCode && <Text style={styles.errorText}>{errors.unitCode}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.statusButtonsContainer}>
              {UNIT_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusButton,
                    status === s.value && {
                      backgroundColor: s.color,
                      borderColor: s.color,
                    },
                  ]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === s.value && styles.statusButtonTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Bedrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 12 }]}>
              <Text style={styles.label}>Bathrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Square Feet</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 850"
              value={squareFeet}
              onChangeText={setSquareFeet}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Rent</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                placeholder="1500"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, createUnit.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createUnit.isPending}
          >
            {createUnit.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Unit</Text>
            )}
          </TouchableOpacity>
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
  propertyBanner: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B3D9FF',
  },
  propertyBannerText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  form: {
    padding: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    fontSize: 16,
    color: '#666',
    zIndex: 1,
    fontWeight: '600',
  },
  inputWithPrefix: {
    paddingLeft: 28,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
});
