import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSpecialists } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

interface Specialist {
  id: string;
  user_id: string;
  name: string;
  specialties: string[];
  bio: string | null;
  rating: number | null;
  review_count: number | null;
  hourly_rate: number | null;
  phone: string | null;
  email: string;
  location: string | null;
  profile_photo: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

const SpecialistDirectoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data: specialists = [], isLoading, error } = useSpecialists();
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Extract unique specialties from all specialists
  const allSpecialties = useMemo(() => {
    const specialtiesSet = new Set<string>();
    specialists.forEach((specialist: Specialist) => {
      if (Array.isArray(specialist.specialties)) {
        specialist.specialties.forEach((s) => specialtiesSet.add(s));
      }
    });
    return Array.from(specialtiesSet).sort();
  }, [specialists]);

  // Filter specialists based on search and selected specialty
  const filteredSpecialists = useMemo(() => {
    return specialists.filter((specialist: Specialist) => {
      const matchesSearch =
        specialist.name.toLowerCase().includes(searchText.toLowerCase()) ||
        specialist.bio?.toLowerCase().includes(searchText.toLowerCase()) ||
        specialist.location?.toLowerCase().includes(searchText.toLowerCase());

      const matchesSpecialty =
        !selectedSpecialty ||
        (Array.isArray(specialist.specialties) &&
          specialist.specialties
            .map((s) => s.toLowerCase())
            .includes(selectedSpecialty.toLowerCase()));

      return matchesSearch && matchesSpecialty;
    });
  }, [specialists, searchText, selectedSpecialty]);

  const handleContact = async (specialistId: string, specialistName: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to contact specialists');
      return;
    }

    try {
      setMessaging(specialistId);
      // Create initial message
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: user.id,
          recipient_id: specialistId,
          content: `Hi ${specialistName}, I'm interested in your services.`,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Navigate to messaging screen
      navigation.navigate('Messaging' as never);
    } catch (err) {
      Alert.alert('Error', 'Failed to initiate contact. Please try again.');
      console.error(err);
    } finally {
      setMessaging(null);
    }
  };

  const renderSpecialistCard = useCallback(({ item: specialist }: { item: Specialist }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('SpecialistProfile', { specialistId: specialist.id })}
      activeOpacity={0.7}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {specialist.profile_photo ? (
          <Image
            source={{ uri: specialist.profile_photo }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.avatarText}>{specialist.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{specialist.name}</Text>
          {specialist.location && (
            <Text style={styles.location}>{specialist.location}</Text>
          )}
          {specialist.rating !== null && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {specialist.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({specialist.review_count || 0} reviews)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bio */}
      {specialist.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {specialist.bio}
        </Text>
      )}

      {/* Specialties */}
      {specialist.specialties && specialist.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {specialist.specialties.slice(0, 3).map((specialty, idx) => (
            <View key={idx} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {specialist.specialties.length > 3 && (
            <View style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>+{specialist.specialties.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Price and Contact */}
      <View style={styles.footer}>
        {specialist.hourly_rate && (
          <Text style={styles.price}>${specialist.hourly_rate}/hour</Text>
        )}
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => (navigation as any).navigate('SpecialistProfile', { specialistId: specialist.id })}
        >
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContact(specialist.id, specialist.name)}
          disabled={messaging === specialist.id}
        >
          {messaging === specialist.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.contactButtonText}>Contact</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [messaging, user?.id, navigation]);

  const renderSkeletonCard = () => (
    <View style={styles.card}>
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: '#e8e8e8' }]} />
        <View style={styles.profileInfo}>
          <View style={[styles.skeletonLine, { width: '50%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '35%', height: 12, marginTop: 6 }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: '90%', height: 13, marginBottom: 6 }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 13, marginBottom: 12 }]} />
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        <View style={[styles.skeletonLine, { width: 70, height: 28, borderRadius: 16 }]} />
        <View style={[styles.skeletonLine, { width: 80, height: 28, borderRadius: 16 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: '100%', height: 1, marginBottom: 12 }]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.skeletonLine, { width: 80, height: 14 }]} />
        <View style={[styles.skeletonLine, { width: 100, height: 34, borderRadius: 8 }]} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find Specialists</Text>
          </View>
          <View style={{ padding: 16 }}>
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>{renderSkeletonCard()}</React.Fragment>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Failed to load specialists</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Specialists</Text>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('SpecialistRegistration' as never)}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, skills, location..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Specialty Filter */}
      {allSpecialties.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedSpecialty === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecialty(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSpecialty === null && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {allSpecialties.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.filterChip,
                selectedSpecialty === specialty && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSpecialty === specialty && styles.filterChipTextActive,
                ]}
              >
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Specialists List */}
      <FlatList
        data={filteredSpecialists}
        renderItem={renderSpecialistCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No specialists found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  bio: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#E8F4FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  specialtyText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28A745',
  },
  contactButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  skeletonLine: {
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  viewProfileButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  viewProfileButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SpecialistDirectoryScreen;
