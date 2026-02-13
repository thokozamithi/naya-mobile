import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateMaintenanceRequest } from '@/hooks/useData';
import { MaintenanceRequest } from '@/types';

const STATUSES = [
  { value: 'pending', label: 'Pending', color: '#8E8E93' },
  { value: 'open', label: 'Open', color: '#FF9500' },
  { value: 'in_progress', label: 'In Progress', color: '#007AFF' },
  { value: 'completed', label: 'Completed', color: '#34C759' },
  { value: 'cancelled', label: 'Cancelled', color: '#FF3B30' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#34C759' },
  { value: 'medium', label: 'Medium', color: '#FF9500' },
  { value: 'high', label: 'High', color: '#FF3B30' },
];

interface RouteParams {
  request: MaintenanceRequest;
}

export default function MaintenanceRequestDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { activeRole } = useAuth();
  const updateRequest = useUpdateMaintenanceRequest();
  const { request } = (route.params as RouteParams) || {};

  const [isUpdating, setIsUpdating] = useState(false);

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Maintenance request not found</Text>
      </View>
    );
  }

  const currentStatus = STATUSES.find((s) => s.value === request.status) || STATUSES[0];
  const currentPriority = PRIORITIES.find((p) => p.value === request.priority) || PRIORITIES[1];

  const handleStatusUpdate = async (newStatus: string) => {
    if (activeRole !== 'landlord' && activeRole !== 'employee') {
      Alert.alert('Permission Denied', 'Only landlords and employees can update request status');
      return;
    }

    try {
      setIsUpdating(true);
      await updateRequest.mutateAsync({
        id: request.id,
        status: newStatus,
      });

      Alert.alert('Success', 'Status updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const promptStatusChange = () => {
    const nextStatuses = STATUSES.filter((s) => s.value !== request.status);

    Alert.alert(
      'Update Status',
      'Select new status:',
      [
        ...nextStatuses.map((status) => ({
          text: status.label,
          onPress: () => handleStatusUpdate(status.value),
        })),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'open':
        return '📋';
      case 'in_progress':
        return '🔧';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '🟡';
    }
  };

  const canUpdateStatus = activeRole === 'landlord' || activeRole === 'employee';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{request.title}</Text>
          <Text style={styles.workOrderCode}>{request.work_order_code}</Text>
        </View>

        <View style={styles.badgesRow}>
          <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '20' }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(request.status)}</Text>
            <Text style={[styles.statusText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: currentPriority.color + '20' }]}>
            <Text style={styles.priorityIcon}>{getPriorityIcon(request.priority)}</Text>
            <Text style={[styles.priorityText, { color: currentPriority.color }]}>
              {currentPriority.label} Priority
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{request.description}</Text>
        </View>

        {request.property_id && (
          <View style={styles.section}>
            <Text style={styles.label}>Property</Text>
            <Text style={styles.value}>Property ID: {request.property_id}</Text>
          </View>
        )}

        {request.unit_id && (
          <View style={styles.section}>
            <Text style={styles.label}>Unit</Text>
            <Text style={styles.value}>Unit ID: {request.unit_id}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Reported By</Text>
          <Text style={styles.value}>User ID: {request.reported_by}</Text>
        </View>

        {request.assigned_to && (
          <View style={styles.section}>
            <Text style={styles.label}>Assigned To</Text>
            <Text style={styles.value}>Employee ID: {request.assigned_to}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>
            {new Date(request.created_at).toLocaleDateString()} at{' '}
            {new Date(request.created_at).toLocaleTimeString()}
          </Text>
        </View>

        {canUpdateStatus && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
              onPress={promptStatusChange}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Status</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!canUpdateStatus && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Only landlords and employees can update the status of this request.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  workOrderCode: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  priorityIcon: {
    fontSize: 16,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
});
