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
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePropertyDetail, useDeleteProperty } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import QRCode from 'react-native-qrcode-svg';

interface RouteParams {
  propertyId: string;
}

export default function PropertyDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { propertyId } = (route.params as RouteParams) || {};
  const { activeRole } = useAuth();
  const { signOut, user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const { property, units, isLoading, error } = usePropertyDetail(propertyId);
  const deleteProperty = useDeleteProperty();

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

  const handleDeleteProperty = () => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.name}"? This action cannot be undone and will delete all units and associated data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty.mutateAsync(propertyId);
              Alert.alert('Success', 'Property deleted successfully');
              if (activeRole === 'landlord') {
                navigation.navigate('LandlordHome', { activeTab: 'properties' } as any);
              } else {
                navigation.goBack();
              }
            } catch (error: any) {
              console.error('Error deleting property:', error);
              Alert.alert('Error', error.message || 'Failed to delete property');
            }
          },
        },
      ]
    );
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

        {/* Property Code - Prominent for sharing with tenants */}
        {property.property_code && (
          <View style={styles.propertyCodeCard}>
            <Text style={styles.propertyCodeLabel}>Property Code</Text>
            <Text style={styles.propertyCodeValue}>{property.property_code}</Text>
            <Text style={styles.propertyCodeHint}>
              Share this code with tenants to let them join your property
            </Text>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQRModal(true)}
            >
              <Text style={styles.qrButtonText}>📱 Show QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Units Management Card */}
        {activeRole === 'landlord' && (
          <TouchableOpacity
            style={styles.manageUnitsCard}
            onPress={() =>
              navigation.navigate('UnitsManagement', {
                propertyId: property.id,
                propertyName: property.name,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.manageUnitsContent}>
              <View style={styles.manageUnitsLeft}>
                <Text style={styles.manageUnitsIcon}>🏢</Text>
                <View>
                  <Text style={styles.manageUnitsTitle}>Manage Units</Text>
                  <Text style={styles.manageUnitsSubtitle}>
                    {units?.length || 0} unit{units?.length !== 1 ? 's' : ''} • Add, edit, and assign tenants
                  </Text>
                </View>
              </View>
              <Text style={styles.manageUnitsArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

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
                    <Text style={styles.unitCode}>Join Code: {unit.unit_join_code}</Text>
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
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteProperty}
                disabled={deleteProperty.isPending}
              >
                {deleteProperty.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Property</Text>
                )}
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

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* QR Code Modal */}
    <Modal
      visible={showQRModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => { setShowQRModal(false); setSelectedUnit(null); }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedUnit ? `Unit ${selectedUnit.unit_name} QR Code` : 'Select Unit for QR Code'}
            </Text>
            <TouchableOpacity onPress={() => { setShowQRModal(false); setSelectedUnit(null); }}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selectedUnit ? (
            <View style={styles.qrContainer}>
              <Text style={styles.qrPropertyName}>{property?.name}</Text>
              <Text style={styles.qrInstructions}>
                Select a unit to generate its QR code for tenants to scan and join:
              </Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {units.map((unit: any) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={styles.unitSelectItem}
                    onPress={() => setSelectedUnit(unit)}
                  >
                    <View>
                      <Text style={styles.unitSelectName}>{unit.unit_name}</Text>
                      <Text style={styles.unitSelectCode}>Join Code: {unit.unit_join_code}</Text>
                    </View>
                    <Text style={styles.unitSelectArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.qrContainer}>
              <Text style={styles.qrPropertyName}>{property?.name} - {selectedUnit.unit_name}</Text>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={selectedUnit.unit_join_code}
                  size={250}
                  backgroundColor="#fff"
                  color="#000"
                />
              </View>
              <Text style={styles.qrCodeText}>{selectedUnit.unit_join_code}</Text>
              <Text style={styles.qrInstructions}>
                Tenants can scan this QR code or enter the code to join this unit
              </Text>
              <TouchableOpacity
                style={styles.backToUnitsBtn}
                onPress={() => setSelectedUnit(null)}
              >
                <Text style={styles.backToUnitsBtnText}>← Back to Units</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => { setShowQRModal(false); setSelectedUnit(null); }}
          >
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  propertyCodeCard: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  propertyCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  propertyCodeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  propertyCodeHint: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  qrButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  manageUnitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manageUnitsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageUnitsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  manageUnitsIcon: {
    fontSize: 32,
  },
  manageUnitsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  manageUnitsSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  manageUnitsArrow: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPropertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  unitSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unitSelectCode: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  unitSelectArrow: {
    fontSize: 18,
    color: '#007AFF',
  },
  backToUnitsBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backToUnitsBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
