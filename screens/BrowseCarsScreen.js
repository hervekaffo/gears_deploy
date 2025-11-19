import React, { useState, useMemo, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VehicleCard from './VehicleCard';
import FilterModal from './FilterModal';
import { VehicleContext } from '../store/vehicle-context';

const initialFilters = {
  price: [10, 500],
  vehicleType: [],
  make: [],
  model: [],
  year: [],
  seats: null,
  electric: false,
  pickup: 'all',
  features: [],
  power: [],
  radius: 50,
};

export default function BrowseCarsScreen() {
  const { vehicles } = useContext(VehicleContext);
  const [filters, setFilters] = useState(initialFilters);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Price
      const nightly = vehicle.dailyRate ?? vehicle.price ?? 0;
      if (nightly < filters.price[0] || nightly > filters.price[1]) return false;
      // Vehicle type
      if (filters.vehicleType.length && !filters.vehicleType.includes(vehicle.vehicleType)) return false;
      // Make
      const brand = vehicle.brand || vehicle.make;
      if (filters.make.length && !filters.make.includes(brand)) return false;
      // Model
      if (filters.model.length && !filters.model.includes(vehicle.model)) return false;
      // Year
      if (filters.year.length && !filters.year.includes(vehicle.year)) return false;
      // Seats
      const capacity = vehicle.capacity ?? vehicle.seats;
      if (filters.seats && (capacity == null || capacity < filters.seats)) return false;
      // Electric
      if (filters.electric && !(vehicle.electric || (vehicle.powerType && vehicle.powerType.toLowerCase().includes('electric')))) return false;
      // Pickup
      if (
        filters.pickup !== 'all' &&
        !(
          vehicle.fulfillmentOptions?.includes?.(filters.pickup) ||
          vehicle.pickupOptions?.includes?.(filters.pickup)
        )
      ) return false;
      if (filters.features.length) {
        const features = vehicle.features || [];
        if (!filters.features.every(tag => features.includes(tag))) return false;
      }
      if (filters.power.length) {
        const power = (vehicle.powerType || (vehicle.electric ? 'Electric' : '')).toLowerCase();
        if (!filters.power.some(p => power.includes(p.toLowerCase()))) return false;
      }
      return true;
    });
  }, [vehicles, filters]);

  // Count applied filters (for badge)
  const appliedFilterCount = Object.keys(filters).reduce((acc, key) => {
    const val = filters[key];
    if (
      (Array.isArray(val) && val.length) ||
      (typeof val === 'number' && val !== null && !(key === 'radius' && val === 50)) ||
      (typeof val === 'boolean' && val === true) ||
      (typeof val === 'string' && val !== 'all')
    ) {
      acc += 1;
    }
    return acc;
  }, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={22} color="#8268fa" />
          <Text style={styles.filterText}>
            Filters{appliedFilterCount ? ` ${appliedFilterCount}` : ''}
          </Text>
        </TouchableOpacity>
        <Text style={styles.resultsText}>
          {filteredVehicles.length} vehicles available
        </Text>
      </View>

      {/* Vehicle list */}
      <FlatList
        data={filteredVehicles}
        renderItem={({ item }) => <VehicleCard vehicle={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', marginTop: 30, alignSelf: 'center' }}>
            No vehicles found
          </Text>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        setFilters={setFilters}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={initialFilters}
        carData={vehicles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: '#1b1b1b',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    borderRadius: 30,
    backgroundColor: '#211b2b'
  },
  filterText: {
    color: '#8268fa',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6
  },
  resultsText: {
    color: '#fff',
    fontSize: 16
  }
});
