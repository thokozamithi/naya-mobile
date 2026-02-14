import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useProjectDetail, useProjectUpdates, useUpdateProject, useAddProjectUpdate } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime } from '@/lib/utils';

interface RouteParams {
  projectId: string;
}

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
const PROGRESS_OPTIONS = [0, 10, 25, 50, 75, 90, 100];

export default function ProjectDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = (route.params as RouteParams) || {};
  const { activeRole, user } = useAuth();

  const { project, isLoading, error, refetch } = useProjectDetail(projectId);
  const { data: updates = [] } = useProjectUpdates(projectId);
  const updateProjectMutation = useUpdateProject();
  const addUpdateMutation = useAddProjectUpdate();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

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

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = project.status;
    if (newStatus === oldStatus) {
      setShowStatusModal(false);
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({ id: project.id, status: newStatus });
      await addUpdateMutation.mutateAsync({
        project_id: project.id,
        status_change: `${oldStatus}→${newStatus}`,
        note: `Status changed to ${newStatus.replace('_', ' ')}`,
      });
      await refetch();
      setShowStatusModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    try {
      await updateProjectMutation.mutateAsync({ id: project.id, progress: newProgress });
      await addUpdateMutation.mutateAsync({
        project_id: project.id,
        progress_change: newProgress,
        note: `Progress updated to ${newProgress}%`,
      });
      await refetch();
      setShowProgressModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update progress');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addUpdateMutation.mutateAsync({
        project_id: project.id,
        note: noteText.trim(),
      });
      setNoteText('');
      setShowNoteModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add note');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#FF9500';
      case 'pending': return '#5AC8FA';
      case 'on_hold': return '#FF3B30';
      case 'cancelled': return '#999';
      default: return '#999';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#5AC8FA';
      case 'low': return '#34C759';
      default: return '#999';
    }
  };

  const daysUntilDue = project.due_date
    ? Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const canEdit = activeRole === 'landlord' || activeRole === 'employee' || activeRole === 'builder';

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Project Header */}
        <View style={styles.projectHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
            <Text style={styles.statusText}>{project.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{project.title}</Text>
          {project.property?.name && (
            <Text style={styles.propertyName}>📍 {project.property.name}</Text>
          )}
          <View style={styles.metaRow}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) + '22' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(project.priority) }]}>
                {project.priority} priority
              </Text>
            </View>
            {project.due_date && (
              <Text style={[styles.dueDate, daysUntilDue !== null && daysUntilDue < 0 ? { color: '#FF3B30' } : {}]}>
                Due: {formatDate(project.due_date)}
                {daysUntilDue !== null && daysUntilDue > 0 && ` (${daysUntilDue}d left)`}
                {daysUntilDue !== null && daysUntilDue < 0 && ` (${Math.abs(daysUntilDue)}d overdue)`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Description */}
          {project.description && (
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{project.description}</Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <Text style={styles.label}>Progress</Text>
              <Text style={styles.progressText}>{project.progress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${project.progress}%`, backgroundColor: getStatusColor(project.status) }]} />
            </View>
          </View>

          {/* Detail Cards */}
          <View style={styles.detailsRow}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: getStatusColor(project.status) }]}>
                {project.status.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Priority</Text>
              <Text style={[styles.detailValue, { color: getPriorityColor(project.priority) }]}>
                {project.priority}
              </Text>
            </View>
            {project.budget !== null && project.budget !== undefined && (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>${Number(project.budget).toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Timeline */}
          <View style={styles.row}>
            {project.started_at && (
              <View style={styles.columnSection}>
                <Text style={styles.label}>Started</Text>
                <Text style={styles.value}>{formatDate(project.started_at)}</Text>
              </View>
            )}
            {project.completed_at && (
              <View style={styles.columnSection}>
                <Text style={styles.label}>Completed</Text>
                <Text style={styles.value}>{formatDate(project.completed_at)}</Text>
              </View>
            )}
          </View>

          {/* Assigned Employees */}
          {project.assignments && project.assignments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Assigned Team</Text>
              {project.assignments.map((a: any) => (
                <View key={a.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentAvatar}>
                    <Text style={styles.assignmentAvatarText}>
                      {(a.employee?.full_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assignmentName}>{a.employee?.full_name || 'Unknown'}</Text>
                    <Text style={styles.assignmentRole}>{a.role} • {a.employee?.email || ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowProgressModal(true)}
              >
                <Text style={styles.secondaryButtonText}>Update Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowNoteModal(true)}
              >
                <Text style={styles.secondaryButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Activity Log */}
          <View style={styles.section}>
            <Text style={styles.label}>Activity Log</Text>
            {updates.length === 0 ? (
              <Text style={styles.emptyText}>No updates yet</Text>
            ) : (
              updates.slice(0, 20).map((upd: any) => (
                <View key={upd.id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1 }}>
                    {upd.status_change && (
                      <Text style={styles.activityStatus}>{upd.status_change.replace('→', ' → ')}</Text>
                    )}
                    {upd.progress_change !== null && upd.progress_change !== undefined && (
                      <Text style={styles.activityProgress}>Progress: {upd.progress_change}%</Text>
                    )}
                    {upd.note && <Text style={styles.activityNote}>{upd.note}</Text>}
                    <Text style={styles.activityTime}>{formatTime(upd.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.modalOption, project.status === s && styles.modalOptionActive]}
                onPress={() => handleStatusChange(s)}
              >
                <View style={[styles.modalDot, { backgroundColor: getStatusColor(s) }]} />
                <Text style={[styles.modalOptionText, project.status === s && styles.modalOptionTextActive]}>
                  {s.replace('_', ' ')}
                </Text>
                {project.status === s && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowStatusModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Progress Modal */}
      <Modal visible={showProgressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Progress</Text>
            {PROGRESS_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.modalOption, project.progress === p && styles.modalOptionActive]}
                onPress={() => handleProgressChange(p)}
              >
                <Text style={styles.modalOptionText}>{p}%</Text>
                <View style={styles.modalProgressBar}>
                  <View style={[styles.modalProgressFill, { width: `${p}%` }]} />
                </View>
                {project.progress === p && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowProgressModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Write a note or update..."
              multiline
              numberOfLines={4}
              value={noteText}
              onChangeText={setNoteText}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.primaryButton, !noteText.trim() && { opacity: 0.5 }]}
              onPress={handleAddNote}
              disabled={!noteText.trim() || addUpdateMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {addUpdateMutation.isPending ? 'Saving...' : 'Save Note'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowNoteModal(false); setNoteText(''); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#fff' },
  backLink: { color: '#0066cc', fontSize: 14 },
  projectHeader: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  propertyName: { fontSize: 14, color: '#666', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  dueDate: { fontSize: 12, color: '#666' },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#333', lineHeight: 22 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 16, fontWeight: '600', color: '#0066cc' },
  progressBarContainer: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', marginBottom: 16 },
  columnSection: { flex: 1, marginRight: 16 },
  detailsRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  detailCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  detailLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: '#0066cc', textTransform: 'capitalize' },
  assignmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  assignmentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5AC8FA', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  assignmentAvatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  assignmentName: { fontSize: 14, fontWeight: '600', color: '#000' },
  assignmentRole: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  actionButtons: { marginTop: 8, marginBottom: 16, gap: 10 },
  primaryButton: { backgroundColor: '#0066cc', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#0066cc' },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 16 },
  activityItem: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5AC8FA', marginRight: 10, marginTop: 4 },
  activityStatus: { fontSize: 13, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  activityProgress: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  activityNote: { fontSize: 13, color: '#333', marginTop: 2 },
  activityTime: { fontSize: 11, color: '#999', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  modalOptionActive: { backgroundColor: '#f0f8ff' },
  modalOptionText: { fontSize: 15, color: '#333', flex: 1, textTransform: 'capitalize' },
  modalOptionTextActive: { fontWeight: '600', color: '#0066cc' },
  modalDot: { width: 10, height: 10, borderRadius: 5 },
  modalCheck: { fontSize: 16, color: '#0066cc', fontWeight: '700' },
  modalCancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#FF3B30', fontWeight: '600' },
  modalProgressBar: { flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden', marginHorizontal: 10 },
  modalProgressFill: { height: '100%', backgroundColor: '#0066cc', borderRadius: 3 },
  noteInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 100, marginBottom: 12 },
});
