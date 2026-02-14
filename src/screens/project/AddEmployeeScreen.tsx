import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAddEmployee } from '@/hooks/useData';

export default function AddEmployeeScreen() {
  const navigation = useNavigation<any>();
  const addEmployee = useAddEmployee();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter the employee\'s full name');
      return;
    }

    try {
      await addEmployee.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      Alert.alert('Success', `${fullName} has been added to your team`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add employee');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Employee</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. John Smith"
            placeholderTextColor="#999"
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555-0123"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, addEmployee.isPending && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={addEmployee.isPending}
        >
          {addEmployee.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Employee</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          The employee will be added to your team and can be assigned to projects.
        </Text>
      </View>
    </KeyboardAvoidingView>
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
  addButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
