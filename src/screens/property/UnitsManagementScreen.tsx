import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUnits, useDeleteUnit } from '@/hooks/useData';

interface RouteParams {
  propertyId: string;
  propertyName: string;
}

export default function UnitsManagementScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { propertyId, propertyName } = (route.params as RouteParams) || {};

  const { data: units = [], isLoading, refetch } = useUnits(propertyId);
  const deleteUnit = useDeleteUnit();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant':
        return '#34C759';
      case 'occupied':
        return '#007AFF';
      case 'maintenance':
        return '#FF9500';
      case 'unavailable':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vacant':
        return '✓';
      case 'occupied':
        return '👤';
      case 'maintenance':
        return '🔧';
      case 'unavailable':
        return '🚫';
      default:
        return '•';
    }
  };

  const handleAddUnit = () => {
    navigation.navigate('AddUnit', { propertyId, propertyName });
  };

  const handleEditUnit = (unit: any) => {
    navigation.navigate('EditUnit', { unit, propertyId, propertyName });
  };

  const handleDeleteUnit = (unit: any, e?: any) => {
    if (e) {
      e.stopPropagation();
    }

    Alert.alert(
      'Delete Unit',
      `Are you sure you want to delete "${unit.unit_name}"? This action cannot be undone.`,
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
              await deleteUnit.mutateAsync({ unitId: unit.id, propertyId });
              Alert.alert('Success', 'Unit deleted successfully');
              refetch();
            } catch (error: any) {
              console.error('Error deleting unit:', error);
              Alert.alert('Error', error.message || 'Failed to delete unit');
            }
          },
        },
      ]
    );
  };

  const vacantUnits = units.filter((u: any) => u.status === 'vacant');
  const occupiedUnits = units.filter((u: any) => u.status === 'occupied');
  const maintenanceUnits = units.filter((u: any) => u.status === 'maintenance');
  const unavailableUnits = units.filter((u: any) => u.status === 'unavailable');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Units</Text>
          <Text style={styles.headerSubtitle}>{propertyName}</Text>
        </View>
        <TouchableOpacity onPress={handleAddUnit}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.summaryNumber}>{vacantUnits.length}</Text>
            <Text style={styles.summaryLabel}>Vacant</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.summaryNumber}>{occupiedUnits.length}</Text>
            <Text style={styles.summaryLabel}>Occupied</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.summaryNumber}>{maintenanceUnits.length}</Text>
            <Text style={styles.summaryLabel}>Maintenance</Text>
          </View>
        </View>

        {isLoading && !refreshing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading units...</Text>
          </View>
        )}

        {!isLoading && units.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No Units Yet</Text>
            <Text style={styles.emptyText}>
              Add units to start managing tenants and rent for this property
            </Text>
            <TouchableOpacity style={styles.addFirstButton} onPress={handleAddUnit}>
              <Text style={styles.addFirstButtonText}>+ Add First Unit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Units List */}
        {units.length > 0 && (
          <View style={styles.unitsList}>
            {units.map((unit: any) => (
              <TouchableOpacity
                key={unit.id}
                style={styles.unitCard}
                onPress={() => handleEditUnit(unit)}
                activeOpacity={0.7}
              >
                <View style={styles.unitHeader}>
                  <View style={styles.unitLeft}>
                    <Text style={styles.unitName}>{unit.unit_name}</Text>
                    <Text style={styles.unitCode}>Code: {unit.unit_code}</Text>
                  </View>
                  <View style={styles.unitActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(unit.status) + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(unit.status) },
                        ]}
                      >
                        {getStatusIcon(unit.status)} {unit.status}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={(e) => handleDeleteUnit(unit, e)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.unitDetails}>
                  {unit.bedrooms && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>🛏</Text>
                      <Text style={styles.detailText}>
                        {unit.bedrooms} bed
                      </Text>
                    </View>
                  )}
                  {unit.bathrooms && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>🚿</Text>
                      <Text style={styles.detailText}>
                        {unit.bathrooms} bath
                      </Text>
                    </View>
                  )}
                  {unit.square_feet && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>📐</Text>
                      <Text style={styles.detailText}>
                        {unit.square_feet} sq ft
                      </Text>
                    </View>
                  )}
                </View>

                {unit.monthly_rent && (
                  <View style={styles.unitRent}>
                    <Text style={styles.rentLabel}>Monthly Rent:</Text>
                    <Text style={styles.rentAmount}>
                      ${parseFloat(unit.monthly_rent).toFixed(2)}
                    </Text>
                  </View>
                )}

                <Text style={styles.tapHint}>Tap to edit</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Add Button */}
      {units.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddUnit}>
          <Text style={styles.fabText}>+ Add Unit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  unitsList: {
    padding: 16,
    gap: 12,
  },
  unitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unitLeft: {
    flex: 1,
  },
  unitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
  unitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  unitCode: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  unitDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitRent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  rentLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  tapHint: {
    fontSize: 11,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
