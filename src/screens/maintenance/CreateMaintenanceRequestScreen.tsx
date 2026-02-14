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
import { useMembership, useCreateTenantMaintenanceRequest } from '@/hooks/useQueries';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#34C759' },
  { value: 'medium', label: 'Medium', color: '#FF9500' },
  { value: 'high', label: 'High', color: '#FF3B30' },
];

interface RouteParams {
  propertyId?: string;
  unitId?: string;
  propertyName?: string;
}

export default function CreateMaintenanceRequestScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user, activeRole } = useAuth();
  
  // Use membership hook for tenant context
  const { 
    isJoined, 
    activeProperty, 
    activeUnit, 
    tenantId,
    isLoading: membershipLoading 
  } = useMembership();
  
  const createRequest = useCreateTenantMaintenanceRequest();
  
  // Route params can override (for landlord initiated requests)
  const routeParams = (route.params as RouteParams) || {};
  
  // Determine effective property/unit context
  const effectivePropertyId = routeParams.propertyId || activeProperty?.id;
  const effectiveUnitId = routeParams.unitId || activeUnit?.id;
  const effectivePropertyName = routeParams.propertyName || activeProperty?.name;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a maintenance request');
      return;
    }

    // For tenants, require membership context
    if (activeRole === 'tenant' && !tenantId) {
      Alert.alert('Error', 'You must join a property before creating maintenance requests');
      return;
    }

    try {
      await createRequest.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        priority,
      });

      Alert.alert('Success', 'Maintenance request created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating maintenance request:', error);
      Alert.alert('Error', error.message || 'Failed to create maintenance request');
    }
  };

  // Loading state
  if (membershipLoading && activeRole === 'tenant') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Maintenance</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Not joined state for tenants
  if (activeRole === 'tenant' && !isJoined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Maintenance</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.notJoinedContainer}>
          <Text style={styles.notJoinedIcon}>🏠</Text>
          <Text style={styles.notJoinedTitle}>Join a property first</Text>
          <Text style={styles.notJoinedText}>
            You need to join a property before you can submit maintenance requests.
          </Text>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('JoinProperty');
            }}
          >
            <Text style={styles.joinButtonText}>Join Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Request Maintenance</Text>
          <View style={{ width: 60 }} />
        </View>

        {effectivePropertyName && (
          <View style={styles.propertyBanner}>
            <Text style={styles.propertyBannerText}>For: {effectivePropertyName}</Text>
            {activeUnit && (
              <Text style={styles.unitBannerText}>Unit: {activeUnit.unit_name}</Text>
            )}
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issue Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g. Leaking faucet in kitchen"
              value={title}
              onChangeText={setTitle}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority *</Text>
            <View style={styles.priorityButtonsContainer}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityButton,
                    priority === p.value && {
                      backgroundColor: p.color,
                      borderColor: p.color,
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p.value && styles.priorityButtonTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="Please describe the issue in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Include as much detail as possible to help us resolve the issue quickly
            </Text>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, createRequest.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  notJoinedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notJoinedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  notJoinedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  notJoinedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  propertyBanner: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B8DAFF',
  },
  propertyBannerText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  unitBannerText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  priorityButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priorityButtonTextActive: {
    color: '#fff',
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
});
