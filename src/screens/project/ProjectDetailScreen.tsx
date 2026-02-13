import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useProjectDetail } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

interface RouteParams {
  projectId: string;
}

export default function ProjectDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = (route.params as RouteParams) || {};
  const { activeRole } = useAuth();

  const { project, isLoading, error } = useProjectDetail(projectId);

  if (!projectId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading project details</Text>
      </View>
    );
  }

  const handleEditProject = () => {
    Alert.alert('Edit Project', 'This feature will be available soon');
  };

  const handleUpdateProgress = () => {
    Alert.alert('Update Progress', 'This feature will be available soon');
  };

  const handleAddUpdate = () => {
    Alert.alert('Add Update', 'This feature will be available soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#ff9800';
      case 'pending':
        return '#2196f3';
      case 'on-hold':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const daysRemaining = project.started_at
    ? Math.ceil(
        (new Date(project.completed_at || new Date()).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => {
          if (activeRole === 'builder') {
            navigation.navigate('BuilderHome' as any);
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={styles.backLink}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      {/* Header with images */}
      <View style={styles.imageContainer}>
        {project.photos && project.photos.length > 0 ? (
          <Image
            source={{ uri: project.photos[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}

        {/* Status Badge */}
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}
        >
          <Text style={styles.statusText}>{project.status.replace('-', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* Project Info */}
      <View style={styles.content}>
        <Text style={styles.title}>{project.title}</Text>

        {project.description && (
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{project.description}</Text>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>Progress</Text>
            <Text style={styles.progressText}>{project.progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${project.progress}%` }]}
            />
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.row}>
          {project.started_at && (
            <View style={styles.columnSection}>
              <Text style={styles.label}>Started</Text>
              <Text style={styles.value}>{formatDate(project.started_at)}</Text>
            </View>
          )}
          {project.completed_at && (
            <View style={styles.columnSection}>
              <Text style={styles.label}>Target Completion</Text>
              <Text style={styles.value}>{formatDate(project.completed_at)}</Text>
              {daysRemaining !== null && daysRemaining > 0 && (
                <Text style={styles.daysRemaining}>{daysRemaining} days remaining</Text>
              )}
            </View>
          )}
        </View>

        {/* Budget Section */}
        {project.budget && (
          <View style={styles.section}>
            <Text style={styles.label}>Budget</Text>
            <Text style={styles.budgetValue}>${project.budget.toLocaleString()}</Text>
          </View>
        )}

        {/* Details Cards */}
        <View style={styles.detailsRow}>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(project.status) }]}>
              {project.status}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Progress</Text>
            <Text style={styles.detailValue}>{project.progress}%</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {(activeRole === 'builder' || activeRole === 'employee') && (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleUpdateProgress}>
                <Text style={styles.buttonText}>Update Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleEditProject}>
                <Text style={styles.secondaryButtonText}>Edit Project</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleAddUpdate}>
                <Text style={styles.secondaryButtonText}>Add Update</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d0d0d0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  columnSection: {
    flex: 1,
    marginRight: 16,
  },
  daysRemaining: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 4,
    fontStyle: 'italic',
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 20,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backLink: {
    color: '#0066cc',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
});
