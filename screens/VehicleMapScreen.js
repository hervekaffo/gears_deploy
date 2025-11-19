import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';

export default function VehicleMapScreen({ route, navigation }) {
  const single = route.params?.vehicle || route.params?.car;
  const list = route.params?.vehicles || route.params?.cars;
  const vehicles = Array.isArray(list) ? list : single ? [single] : [];

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const mapRef = useRef(null);

  const defaultRegion = {
    latitude: 35.2226,
    longitude: -97.4395,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const initialRegion = vehicles[0]?.location
    ? {
        latitude: vehicles[0].location.latitude,
        longitude: vehicles[0].location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.13,
      }
    : defaultRegion;

  const jitterRadius =
    Math.min(initialRegion.latitudeDelta, initialRegion.longitudeDelta) * 0.2;

  const jittered = useMemo(() => {
    const groups = {};
    vehicles.forEach(vehicle => {
      if (!vehicle.location) return;
      const key = `${vehicle.location.latitude}_${vehicle.location.longitude}`;
      (groups[key] ||= []).push(vehicle);
    });

    const lookup = {};
    Object.values(groups).forEach(group => {
      const n = group.length;
      group.forEach((vehicle, i) => {
        if (n === 1) {
          lookup[vehicle.id] = { ...vehicle.location };
        } else {
          const angle = (2 * Math.PI * i) / n;
          lookup[vehicle.id] = {
            latitude:
              vehicle.location.latitude + jitterRadius * Math.cos(angle),
            longitude:
              vehicle.location.longitude + jitterRadius * Math.sin(angle),
          };
        }
      });
    });
    return lookup;
  }, [vehicles, jitterRadius]);

  useEffect(() => {
    if (mapRef.current && vehicles.length > 1) {
      const coords = vehicles.map(v => jittered[v.id]).filter(Boolean);
      if (coords.length) {
        setTimeout(() => {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 60, bottom: 240, left: 60 },
            animated: true,
          });
        }, 400);
      }
    }
  }, [vehicles, jittered]);

  if (!vehicles.length) {
    return (
      <View style={styles.emptyOverlay}>
        <Ionicons name="boat-outline" size={50} color="#aaa" />
        <Text style={styles.emptyText}>No vehicles found in this area.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {vehicles.map(vehicle => (
          <Marker
            key={vehicle.id}
            coordinate={jittered[vehicle.id]}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <View style={styles.markerBubble}>
              <Text style={styles.markerText}>
                ${vehicle.dailyRate ?? vehicle.price ?? 0}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedVehicle && (
        <TouchableOpacity
          style={styles.cardBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedVehicle(null)}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => {
              setSelectedVehicle(null);
              navigation.navigate('VehicleDetail', { vehicle: selectedVehicle });
            }}
          >
            {selectedVehicle.image || selectedVehicle.imageUrl ? (
              <Image
                source={
                  selectedVehicle.image || { uri: selectedVehicle.imageUrl }
                }
                style={styles.cardImg}
              />
            ) : (
              <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                <Ionicons name="image-outline" size={28} color="#fff" />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>
                {selectedVehicle.title ||
                  `${selectedVehicle.brand || selectedVehicle.make || ''} ${
                    selectedVehicle.model || ''
                  }`.trim() ||
                  selectedVehicle.vehicleType ||
                  'Adventure vehicle'}
              </Text>
              <View style={styles.cardTagRow}>
                {selectedVehicle.vehicleType ? (
                  <View style={[styles.cardTag, styles.cardTagPrimary]}>
                    <Text style={styles.cardTagText}>{selectedVehicle.vehicleType}</Text>
                  </View>
                ) : null}
                {selectedVehicle.powerType ? (
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{selectedVehicle.powerType}</Text>
                  </View>
                ) : null}
                {selectedVehicle.capacity || selectedVehicle.seats ? (
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>
                      {(selectedVehicle.capacity || selectedVehicle.seats) + '+ seats'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardSubtitle}>
                {(selectedVehicle.rating ?? 0).toFixed(1)}★ ·{' '}
                {selectedVehicle.trips ?? 0} trips ·{' '}
                {selectedVehicle.hostType || 'Trusted host'}
              </Text>
              <View style={styles.cardChipRow}>
                {(selectedVehicle.fulfillmentOptions || selectedVehicle.pickupOptions || [])
                  .slice(0, 2)
                  .map(option => (
                    <View key={option} style={[styles.cardChip, styles.cardChipPrimary]}>
                      <Ionicons name="navigate" size={12} color={GlobalStyles.colors.primary500} style={{ marginRight: 4 }} />
                      <Text style={styles.cardChipText}>{option}</Text>
                    </View>
                  ))}
                {(selectedVehicle.features || [])
                  .slice(0, 2)
                  .map(feature => (
                    <View key={feature} style={styles.cardChip}>
                      <Text style={styles.cardChipText}>{feature}</Text>
                    </View>
                  ))}
              </View>
              <Text style={styles.cardDates}>
                {selectedVehicle.availability?.start &&
                selectedVehicle.availability?.end
                  ? `${selectedVehicle.availability.start} → ${selectedVehicle.availability.end}`
                  : selectedVehicle.dates || 'Flexible availability'}
              </Text>
              <Text style={styles.cardPrice}>
                ${selectedVehicle.dailyRate ?? selectedVehicle.price ?? 0} / day
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedVehicle(null)}
            >
              <Ionicons name="close-circle" size={22} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    minWidth: 35,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#555',
    fontSize: 18,
    fontWeight: '600',
  },
  cardBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'flex-end',
  },
  card: {
    margin: 12,
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 9,
    alignItems: 'center',
    minHeight: 110,
  },
  cardImg: {
    width: 120,
    height: 94,
  },
  cardImgPlaceholder: {
    backgroundColor: '#1f1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTagRow:{
    flexDirection:'row',
    flexWrap:'wrap',
    marginTop:6
  },
  cardTag:{
    paddingHorizontal:8,
    paddingVertical:3,
    borderRadius:10,
    backgroundColor:'#2a2a30',
    marginRight:6,
    marginBottom:6
  },
  cardTagPrimary:{
    backgroundColor:GlobalStyles.colors.primary500 + '33'
  },
  cardTagText:{
    color:'#fff',
    fontSize:11,
    fontWeight:'600'
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  cardChipRow:{
    flexDirection:'row',
    flexWrap:'wrap',
    marginBottom:6
  },
  cardChip:{
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:10,
    paddingVertical:4,
    borderRadius:12,
    backgroundColor:'rgba(255,255,255,0.08)',
    marginRight:6,
    marginBottom:6
  },
  cardChipPrimary:{
    backgroundColor:'rgba(200,162,78,0.18)'
  },
  cardChipText:{
    color:'#fff',
    fontSize:11,
    fontWeight:'600'
  },
  cardDates: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  cardPrice: {
    color: GlobalStyles.colors.accent500 || '#FFD600',
    fontWeight: 'bold',
    fontSize: 17,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 2,
  },
});
