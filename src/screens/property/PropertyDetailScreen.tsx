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
import { usePropertyDetail } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';

interface RouteParams {
  propertyId: string;
}

export default function PropertyDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { propertyId } = (route.params as RouteParams) || {};
  const { activeRole } = useAuth();
  const { signOut, user } = useAuth();

  const { property, units, isLoading, error } = usePropertyDetail(propertyId);

  if (!propertyId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Property not found</Text>
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

  if (error || !property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading property details</Text>
      </View>
    );
  }

  const handleAddUnit = () => {
    navigation.navigate('AddUnit', {
      propertyId,
      propertyName: property.name,
    });
  };

  const handleEditProperty = () => {
    navigation.navigate('EditProperty', { property });
  };

  const handleRequestMaintenance = () => {
    navigation.navigate('CreateMaintenanceRequest', {
      propertyId,
      propertyName: property.name,
    });
  };

  const handleViewPayments = () => {
    navigation.navigate('PropertyPayments', {
      propertyId,
      propertyName: property.name,
    });
  };

  // Navigation handlers for header
  const handleLogoPress = () => navigation.navigate('Home');
  const handleRoleSwitch = () => navigation.navigate('RoleSelection');
  const handleSignOut = () => { if (typeof signOut === 'function') { signOut(); } navigation.navigate('Home'); };

  return (
    <>
      <DashboardHeader
        onLogoPress={handleLogoPress}
        onRoleSwitch={handleRoleSwitch}
        onSignOut={handleSignOut}
        userName={user?.email}
        role={activeRole || undefined}
      />
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => {
          if (activeRole === 'landlord') {
            navigation.navigate('LandlordHome', { activeTab: 'properties' } as any);
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={styles.backLink}>← Back to Properties</Text>
        </TouchableOpacity>
      </View>
      {/* Header with images */}
      <View style={styles.imageContainer}>
        {property.photos && property.photos.length > 0 ? (
          <Image
            source={{ uri: property.photos[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
      </View>

      {/* Property Info */}
      <View style={styles.content}>
        <Text style={styles.title}>{property.name}</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>
            {property.address}, {property.city}, {property.state} {property.zip}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.columnSection}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{property.property_type}</Text>
          </View>
          <View style={styles.columnSection}>
            <Text style={styles.label}>Units</Text>
            <Text style={styles.value}>{property.total_units}</Text>
          </View>
        </View>

        {property.description && (
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{property.description}</Text>
          </View>
        )}

        {/* Units Section */}
        {units && units.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Units ({units.length})</Text>
              {activeRole === 'landlord' && (
                <TouchableOpacity onPress={handleAddUnit}>
                  <Text style={styles.addLink}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {units.map((unit) => (
              <View key={unit.id} style={styles.unitCard}>
                <View style={styles.unitHeader}>
                  <View>
                    <Text style={styles.unitName}>{unit.unit_name}</Text>
                    <Text style={styles.unitCode}>{unit.unit_code}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    unit.status === 'occupied' && styles.status_occupied,
                    unit.status === 'vacant' && styles.status_vacant,
                    unit.status === 'maintenance' && styles.status_maintenance,
                  ]}>
                    <Text style={styles.statusText}>{unit.status}</Text>
                  </View>
                </View>
                {unit.monthly_rent && (
                  <Text style={styles.rent}>${unit.monthly_rent}/month</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {activeRole === 'landlord' && (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEditProperty}>
                <Text style={styles.buttonText}>Edit Property</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleViewPayments}>
                <Text style={styles.secondaryButtonText}>View Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRequestMaintenance}>
                <Text style={styles.secondaryButtonText}>Request Maintenance</Text>
              </TouchableOpacity>
            </>
          )}
          {activeRole === 'tenant' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleRequestMaintenance}>
              <Text style={styles.buttonText}>Report Issue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
    </>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
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
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  columnSection: {
    flex: 1,
    marginRight: 16,
  },
  unitCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  unitCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  status_occupied: {
    backgroundColor: '#d4edda',
  },
  status_vacant: {
    backgroundColor: '#fff3cd',
  },
  status_maintenance: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginTop: 8,
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
