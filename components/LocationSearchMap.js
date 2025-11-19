import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GlobalStyles } from '../constants/styles';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';

export default function LocationSearchMap({ onRegionChange }) {
  const [region, setRegion] = useState(null);
  const mapRef = useRef();

  //  Ask for location permission and get current position
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const initial = {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      };
      setRegion(initial);
      onRegionChange(initial); // let parent load cars here
      // center map
      mapRef.current?.animateToRegion(initial, 1000);
    })();
  }, []);

  //  When user selects a place in the autocomplete, geocode it
  function handlePlaceSelect(data, details = null) {
    if (!details) return;
    const { lat, lng } = details.geometry.location;
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    onRegionChange(newRegion);
  }

  return (
    <View style={{ flex: 1 }}>
      <GooglePlacesAutocomplete
        placeholder="Enter city or address"
        fetchDetails
        onPress={handlePlaceSelect}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
          types: '(cities)'           // restrict to cities
        }}
        styles={{
          container: { position: 'absolute', top: Platform.OS==='ios'?100:60, width: '90%', alignSelf: 'center', zIndex: 10 },
          textInput: { backgroundColor: '#fff', borderRadius: 6 }
        }}
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        onRegionChangeComplete={reg => {
          setRegion(reg);
          onRegionChange(reg);
        }}
      >
        {region && (
          <Marker coordinate={region} title="Search center" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  }
});
