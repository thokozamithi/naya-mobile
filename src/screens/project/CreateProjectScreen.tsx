import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCreateProject, useProperties, useLandlordEmployees, useAssignEmployee } from '@/hooks/useData';
import ErrorModal from '@/components/ErrorModal';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', color: '#34C759' },
  { label: 'Medium', value: 'medium', color: '#5AC8FA' },
  { label: 'High', value: 'high', color: '#FF9500' },
  { label: 'Urgent', value: 'urgent', color: '#FF3B30' },
];

export default function CreateProjectScreen() {
  const navigation = useNavigation<any>();
  const { properties = [] } = useProperties();
  const { data: employees = [] } = useLandlordEmployees();
  const createProject = useCreateProject();
  const assignEmployee = useAssignEmployee();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [budget, setBudget] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const isValidDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  };

  const formatSupabaseError = (err: any) => {
    if (!err) return 'Failed to create project.';
    if (err.code === '42P17') return 'Database policy error: infinite recursion detected. Please contact support.';
    const code = err.code ? ` (${err.code})` : '';
    return `${err.message || 'Failed to create project'}${code}`;
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a project title.');
      setShowErrorModal(true);
      return;
    }

    if (dueDate && !isValidDate(dueDate)) {
      setErrorMessage('Due date must be in YYYY-MM-DD format.');
      setShowErrorModal(true);
      return;
    }

    if (budget && Number.isNaN(parseFloat(budget))) {
      setErrorMessage('Budget must be a valid number.');
      setShowErrorModal(true);
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        property_id: selectedPropertyId,
        priority,
        budget: budget ? parseFloat(budget) : null,
        due_date: dueDate || null,
      });

      // Assign selected employees
      for (const empId of selectedEmployeeIds) {
        try {
          await assignEmployee.mutateAsync({
            projectId: project.id,
            employeeId: empId,
          });
        } catch (err) {
          console.error('Failed to assign employee:', empId, err);
        }
      }

      navigation.replace('ProjectDetail', { projectId: project.id });
    } catch (err: any) {
      console.error('[CreateProjectScreen] Create failed:', err);
      setErrorMessage(formatSupabaseError(err));
      setShowErrorModal(true);
    }
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Kitchen renovation"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the project scope..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.priorityChip,
                  priority === opt.value && { backgroundColor: opt.color + '22', borderColor: opt.color },
                ]}
                onPress={() => setPriority(opt.value)}
              >
                <View style={[styles.priorityDot, { backgroundColor: opt.color }]} />
                <Text style={[styles.priorityLabel, priority === opt.value && { color: opt.color, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.field}>
          <Text style={styles.label}>Budget ($)</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Due Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-12-31"
            placeholderTextColor="#999"
          />
        </View>

        {/* Property */}
        <View style={styles.field}>
          <Text style={styles.label}>Property (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.propertyChip, !selectedPropertyId && styles.propertyChipActive]}
              onPress={() => setSelectedPropertyId(null)}
            >
              <Text style={[styles.propertyChipText, !selectedPropertyId && styles.propertyChipTextActive]}>None</Text>
            </TouchableOpacity>
            {properties.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.propertyChip, selectedPropertyId === p.id && styles.propertyChipActive]}
                onPress={() => setSelectedPropertyId(p.id)}
              >
                <Text style={[styles.propertyChipText, selectedPropertyId === p.id && styles.propertyChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Assign Employees */}
        <View style={styles.field}>
          <Text style={styles.label}>Assign Employees</Text>
          {employees.length === 0 ? (
            <Text style={styles.noEmployees}>No employees added yet. You can assign later.</Text>
          ) : (
            employees.map((emp: any) => (
              <TouchableOpacity
                key={emp.id}
                style={[styles.employeeRow, selectedEmployeeIds.includes(emp.id) && styles.employeeRowActive]}
                onPress={() => toggleEmployee(emp.id)}
              >
                <View style={styles.employeeAvatar}>
                  <Text style={styles.employeeAvatarText}>
                    {(emp.full_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.employeeName}>{emp.full_name}</Text>
                  {emp.email && <Text style={styles.employeeEmail}>{emp.email}</Text>}
                </View>
                <View style={[styles.checkbox, selectedEmployeeIds.includes(emp.id) && styles.checkboxActive]}>
                  {selectedEmployeeIds.includes(emp.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, createProject.isPending && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={createProject.isPending}
        >
          {createProject.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Project</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      <ErrorModal
        visible={showErrorModal}
        title="Project not created"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cancelText: { fontSize: 15, color: '#FF3B30', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  form: { padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#e0e0e0', color: '#000' },
  textArea: { minHeight: 100 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, color: '#666' },
  chipScroll: { flexDirection: 'row' },
  propertyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8 },
  propertyChipActive: { backgroundColor: '#007AFF22', borderColor: '#007AFF' },
  propertyChipText: { fontSize: 13, color: '#666' },
  propertyChipTextActive: { color: '#007AFF', fontWeight: '600' },
  noEmployees: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  employeeRowActive: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  employeeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5AC8FA', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  employeeAvatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  employeeName: { fontSize: 14, fontWeight: '600', color: '#000' },
  employeeEmail: { fontSize: 12, color: '#666' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  createButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
