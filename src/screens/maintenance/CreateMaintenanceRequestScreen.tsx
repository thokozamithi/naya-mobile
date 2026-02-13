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
import { useCreateMaintenanceRequest } from '@/hooks/useData';

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
  const { user } = useAuth();
  const createRequest = useCreateMaintenanceRequest();
  const { propertyId, unitId, propertyName } = (route.params as RouteParams) || {};

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

    try {
      await createRequest.mutateAsync({
        property_id: propertyId || null,
        unit_id: unitId || null,
        reported_by: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'pending',
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

        {propertyName && (
          <View style={styles.propertyBanner}>
            <Text style={styles.propertyBannerText}>For: {propertyName}</Text>
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
  propertyBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  propertyBannerText: {
    fontSize: 14,
    color: '#856404',
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
