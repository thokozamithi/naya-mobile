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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { useQuery } from '@tanstack/react-query';

type Tab = 'portfolio' | 'reviews' | 'skills' | 'availability';

interface RouteParams {
  specialistId: string;
}

export default function SpecialistProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { specialistId } = (route.params as RouteParams) || {};

  const [activeTab, setActiveTab] = useState<Tab>('skills');
  const [contacting, setContacting] = useState(false);

  const { data: specialist, isLoading, error } = useQuery({
    queryKey: ['specialist', specialistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('id', specialistId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!specialistId,
  });

  const handleHire = () => {
    Alert.alert('Hire Specialist', 'Hiring flow will be available soon.');
  };

  const handleMessage = async () => {
    if (!user?.id || !specialist) return;
    setContacting(true);
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: specialist.user_id,
        content: `Hi ${specialist.name}, I'd like to discuss working together.`,
      });
      navigation.navigate('Messaging' as never);
    } catch {
      Alert.alert('Error', 'Failed to start conversation.');
    } finally {
      setContacting(false);
    }
  };

  if (!specialistId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Specialist not found</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate('SpecialistDirectory' as never)}
        >
          <Text style={styles.backLinkText}>Back to Directory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !specialist) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Could not load specialist profile</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate('SpecialistDirectory' as never)}
        >
          <Text style={styles.backLinkText}>Back to Directory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'skills', label: 'Skills & Certs' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'availability', label: 'Availability' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('SpecialistDirectory' as never)}>
          <Text style={styles.backLinkText}>← Back to Directory</Text>
        </TouchableOpacity>
      </View>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {specialist.profile_photo ? (
          <Image source={{ uri: specialist.profile_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{specialist.name?.charAt(0) || '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{specialist.name}</Text>
        {specialist.location && <Text style={styles.location}>{specialist.location}</Text>}

        {specialist.rating !== null && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>
              {specialist.rating?.toFixed(1)} ({specialist.review_count || 0} reviews)
            </Text>
          </View>
        )}

        {specialist.hourly_rate && (
          <Text style={styles.rate}>${specialist.hourly_rate}/hour</Text>
        )}

        {specialist.bio && <Text style={styles.bio}>{specialist.bio}</Text>}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.hireButton} onPress={handleHire}>
          <Text style={styles.hireButtonText}>Hire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleMessage}
          disabled={contacting}
        >
          {contacting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.messageButtonText}>Message</Text>
          )}
        </TouchableOpacity>
      </View>

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

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'skills' && (
          <View>
            {specialist.specialties && specialist.specialties.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Specialties</Text>
                <View style={styles.tagContainer}>
                  {specialist.specialties.map((s: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>No skills listed</Text>
            )}

            {specialist.certifications && specialist.certifications.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Certifications</Text>
                <View style={styles.tagContainer}>
                  {specialist.certifications.map((c: string, i: number) => (
                    <View key={i} style={[styles.tag, styles.certTag]}>
                      <Text style={styles.certTagText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        )}

        {activeTab === 'portfolio' && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No portfolio items yet</Text>
          </View>
        )}

        {activeTab === 'availability' && (
          <View>
            <View style={styles.availabilityCard}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      specialist.availability_status === 'available'
                        ? '#34C759'
                        : specialist.availability_status === 'busy'
                        ? '#FF9500'
                        : '#FF3B30',
                  },
                ]}
              />
              <Text style={styles.availabilityText}>
                {(specialist.availability_status || 'Unknown')
                  .charAt(0)
                  .toUpperCase() +
                  (specialist.availability_status || 'unknown').slice(1)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 },
  location: { fontSize: 14, color: '#666', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', marginBottom: 4 },
  ratingText: { fontSize: 14, color: '#FFB800', fontWeight: '600' },
  rate: { fontSize: 16, fontWeight: '700', color: '#28A745', marginBottom: 8 },
  bio: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hireButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  hireButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  messageButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#007AFF' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#E8F4FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: '#007AFF', fontWeight: '500' },
  certTag: { backgroundColor: '#FFF3CD' },
  certTagText: { fontSize: 13, color: '#856404', fontWeight: '500' },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    gap: 12,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  availabilityText: { fontSize: 16, fontWeight: '600', color: '#333' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 24 },
  errorText: { fontSize: 16, color: '#d32f2f', marginBottom: 12 },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
});
