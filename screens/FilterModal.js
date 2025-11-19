import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, TextInput, ScrollView } from 'react-native';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

const VEHICLE_TYPES = [
  'Boat',
  'Jet Ski',
  'Camper Van',
  'Travel Trailer',
  'ATV',
  'UTV',
  'Motorcycle',
  'Snowmobile',
  'RV',
  'Other',
];
const CAPACITY_OPTIONS = [null, 2, 4, 6, 8, 10];
const FEATURE_TAGS = ['Pet Friendly','Life Jackets','Tow Hitch','Premium Sound','Guided Tour','Sleeps 4+','GPS Included'];
const POWER_TYPES = ['Gas','Diesel','Electric','Human-powered'];
const FULFILLMENT_OPTIONS = [
  { label: 'All fulfillment options', value: 'all' },
  { label: 'Host delivers to you', value: 'delivery' },
  { label: 'Pick up at host location', value: 'pickup' },
  { label: 'Trailer provided', value: 'Trailer Included' },
];

export default function FilterModal({ visible, filters, setFilters, onClose, initialFilters, carData }) {
  const [local, setLocal] = useState(filters);

  // Build options for makes/models/years from data
  const makes = Array.from(new Set(carData.map(c => c.brand || c.make))).filter(Boolean);
  const models = Array.from(new Set(carData.map(c => c.model))).filter(Boolean);
  const years = Array.from(new Set(carData.map(c => c.year))).filter(Boolean).sort((a, b) => b - a);

  function toggleArrayVal(field, value) {
    setLocal(l => ({
      ...l,
      [field]: l[field].includes(value)
        ? l[field].filter(v => v !== value)
        : [...l[field], value]
    }));
  }

  function handleApply() {
    setFilters(local);
    onClose();
  }

  function handleReset() {
    setLocal(initialFilters);
  }

  return (
    <Modal isVisible={visible} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.sheet}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
  <KeyboardAvoidingWrapper contentContainerStyle={{ paddingBottom: 12 }} style={{ marginTop: 10 }}>
          {/* Price */}
          <Text style={styles.sectionTitle}>Daily price</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              keyboardType="number-pad"
              placeholder="$ Min"
              placeholderTextColor="#6b638b"
              value={String(local.price[0])}
              onChangeText={val => setLocal(l => ({ ...l, price: [Number(val) || 0, l.price[1]] }))}
            />
            <Text style={{ color:'#aaa', marginHorizontal:8 }}>to</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="number-pad"
              placeholder="$ Max"
              placeholderTextColor="#6b638b"
              value={String(local.price[1])}
              onChangeText={val => setLocal(l => ({ ...l, price: [l.price[0], Number(val) || 0] }))}
            />
          </View>
          <Text style={[styles.sectionTitle,{ marginTop:16 }]}>Radius</Text>
          <View style={styles.radiusRow}>
            <TouchableOpacity
              style={styles.radiusBtn}
              onPress={() => setLocal(l => ({ ...l, radius: Math.max(10, l.radius - 5) }))}
            >
              <Ionicons name="remove" size={18} color="#8268fa" />
            </TouchableOpacity>
            <Text style={styles.radiusValue}>{local.radius} km</Text>
            <TouchableOpacity
              style={styles.radiusBtn}
              onPress={() => setLocal(l => ({ ...l, radius: Math.min(200, l.radius + 5) }))}
            >
              <Ionicons name="add" size={18} color="#8268fa" />
            </TouchableOpacity>
          </View>
          {/* Vehicle Type */}
          <Text style={styles.sectionTitle}>Vehicle type</Text>
          <View style={styles.row}>
            {VEHICLE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pill,
                  local.vehicleType.includes(type) && styles.pillSelected
                ]}
                onPress={() => toggleArrayVal('vehicleType', type)}
              >
                <Text style={{
                  color: local.vehicleType.includes(type) ? '#fff' : '#8268fa',
                  fontWeight: 'bold'
                }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Make */}
          <Text style={styles.sectionTitle}>Brand / manufacturer</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {makes.map(make => (
              <TouchableOpacity
                key={make}
                style={[styles.pill, local.make.includes(make) && styles.pillSelected]}
                onPress={() => toggleArrayVal('make', make)}
              >
                <Text style={{
                  color: local.make.includes(make) ? '#fff' : '#8268fa'
                }}>{make}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Model */}
          <Text style={styles.sectionTitle}>Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {models.map(model => (
              <TouchableOpacity
                key={model}
                style={[styles.pill, local.model.includes(model) && styles.pillSelected]}
                onPress={() => toggleArrayVal('model', model)}
              >
                <Text style={{
                  color: local.model.includes(model) ? '#fff' : '#8268fa'
                }}>{model}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Year */}
          <Text style={styles.sectionTitle}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                style={[styles.pill, local.year.includes(year) && styles.pillSelected]}
                onPress={() => toggleArrayVal('year', year)}
              >
                <Text style={{
                  color: local.year.includes(year) ? '#fff' : '#8268fa'
                }}>{year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Seats */}
          <Text style={styles.sectionTitle}>Capacity (people)</Text>
          <View style={styles.row}>
            {CAPACITY_OPTIONS.map(seat => (
              <TouchableOpacity
                key={seat || 'all'}
                style={[
                  styles.pill,
                  (seat === local.seats || (seat === null && !local.seats)) && styles.pillSelected
                ]}
                onPress={() => setLocal(l => ({ ...l, seats: seat }))}
              >
                <Text style={{
                  color: (seat === local.seats || (seat === null && !local.seats)) ? '#fff' : '#8268fa'
                }}>{seat ? `${seat}+` : 'All'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Electric */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
            <Text style={styles.sectionTitle}>Electric</Text>
            <Switch
              value={local.electric}
              onValueChange={val => setLocal(l => ({ ...l, electric: val }))}
              thumbColor={local.electric ? '#8268fa' : '#3d3861'}
              trackColor={{ true: '#211b2b', false: '#aaa' }}
              style={{ marginLeft: 10 }}
            />
          </View>
          {/* Fulfillment Options */}
          <Text style={styles.sectionTitle}>Fulfillment</Text>
          <View style={styles.row}>
            {FULFILLMENT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pill,
                  local.pickup === opt.value && styles.pillSelected
                ]}
                onPress={() => setLocal(l => ({ ...l, pickup: opt.value }))}
              >
                <Text style={{
                  color: local.pickup === opt.value ? '#fff' : '#8268fa'
                }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Features */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.rowWrap}>
            {FEATURE_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.pill, local.features.includes(tag) && styles.pillSelected]}
                onPress={() => toggleArrayVal('features', tag)}
              >
                <Text style={{
                  color: local.features.includes(tag) ? '#fff' : '#8268fa'
                }}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Power */}
          <Text style={styles.sectionTitle}>Power source</Text>
          <View style={styles.rowWrap}>
            {POWER_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pill, local.power.includes(type) && styles.pillSelected]}
                onPress={() => toggleArrayVal('power', type)}
              >
                <Text style={{
                  color: local.power.includes(type) ? '#fff' : '#8268fa'
                }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
  </KeyboardAvoidingWrapper>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApply}
        >
          <Text style={styles.applyBtnText}>Show {carData.filter(car => {
            // Same filter logic as above, but using local instead of filters
            if (car.price < local.price[0] || car.price > local.price[1]) return false;
            if (local.vehicleType.length && !local.vehicleType.includes(car.vehicleType)) return false;
            if (local.make.length && !local.make.includes(car.brand || car.make)) return false;
            if (local.model.length && !local.model.includes(car.model)) return false;
            if (local.year.length && !local.year.includes(car.year)) return false;
            const capacity = car.capacity ?? car.seats;
            if (local.seats && (capacity == null || capacity < local.seats)) return false;
            const isElectric = car.electric || (car.powerType && car.powerType.toLowerCase().includes('electric'));
            if (local.electric && !isElectric) return false;
            const fulfillment = car.fulfillmentOptions || car.pickupOptions || [];
            if (local.pickup !== 'all' && !fulfillment.includes(local.pickup)) return false;
            if (local.features.length) {
              const features = car.features || [];
              if (!local.features.every(tag => features.includes(tag))) return false;
            }
            if (local.power.length) {
              const power = (car.powerType || (car.electric ? 'Electric' : '')).toLowerCase();
              if (!local.power.some(p => power.includes(p.toLowerCase()))) return false;
            }
            return true;
          }).length} results</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#18171c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    minHeight: '80%',
    maxHeight: '90%'
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold'
  },
  resetText: {
    color: '#8268fa',
    fontWeight: 'bold',
    fontSize: 16
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 14,
    marginBottom: 4
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  pill: {
    backgroundColor: '#211b2b',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  pillSelected: {
    backgroundColor: '#8268fa'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  priceInput: {
    backgroundColor: '#211b2b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    minWidth: 90,
    textAlign: 'center'
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  radiusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#8268fa',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radiusValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16
  },
  applyBtn: {
    backgroundColor: '#8268fa',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold'
  }
});
