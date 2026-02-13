import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

type Tab = 'profile' | 'skills' | 'certifications' | 'availability';

export default function SpecialistRegistrationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // Skills
  const [skillsText, setSkillsText] = useState('');

  // Certifications
  const [certsText, setCertsText] = useState('');

  // Availability
  const [availability, setAvailability] = useState('available');

  useEffect(() => {
    if (user) loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('specialists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setName(data.name || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setHourlyRate(data.hourly_rate?.toString() || '');
        setSkillsText(Array.isArray(data.specialties) ? data.specialties.join(', ') : '');
        setCertsText(Array.isArray(data.certifications) ? data.certifications.join(', ') : '');
        setAvailability(data.availability_status || 'available');
      }
    } catch {
      // No existing profile — that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const specialties = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const certifications = certsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        user_id: user.id,
        name: name.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        specialties,
        certifications,
        availability_status: availability,
        email: user.email,
      };

      const { data: existing } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('specialists')
          .update(payload)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('specialists').insert(payload);
        if (error) throw error;
      }

      Alert.alert('Success', 'Profile saved successfully');
      navigation.navigate('SpecialistDirectory' as never);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Sign in required</Text>
        <Text style={styles.emptyText}>Please sign in to register as a specialist.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'skills', label: 'Skills' },
    { key: 'certifications', label: 'Certs' },
    { key: 'availability', label: 'Availability' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell clients about yourself"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="City or area"
                value={location}
                onChangeText={setLocation}
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hourly Rate ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
                editable={!saving}
              />
            </View>
          </View>
        )}

        {activeTab === 'skills' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <Text style={styles.hint}>Enter skills separated by commas</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="e.g. Plumbing, Electrical, HVAC"
              value={skillsText}
              onChangeText={setSkillsText}
              multiline
              editable={!saving}
            />
          </View>
        )}

        {activeTab === 'certifications' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.hint}>Enter certifications separated by commas</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="e.g. Licensed Electrician, OSHA Certified"
              value={certsText}
              onChangeText={setCertsText}
              multiline
              editable={!saving}
            />
          </View>
        )}

        {activeTab === 'availability' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability Status</Text>
            {['available', 'busy', 'unavailable'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.radioRow, availability === status && styles.radioRowActive]}
                onPress={() => setAvailability(status)}
              >
                <View style={[styles.radio, availability === status && styles.radioActive]}>
                  {availability === status && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#007AFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  hint: { fontSize: 13, color: '#888', marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  radioRowActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: '#007AFF' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  radioLabel: { fontSize: 16, fontWeight: '500', color: '#333', textTransform: 'capitalize' },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999' },
});
