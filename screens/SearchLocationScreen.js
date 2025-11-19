import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GlobalStyles } from '../constants/styles';

const SECTIONS = [
  {
    title: '',
    data: [
      { key: 'current', label: 'Current location', icon: 'locate-outline' },
      {
        key: 'anywhere',
        label: 'Anywhere',
        subtitle: 'Browse all recreational vehicles',
        icon: 'globe-outline'
      },
    ],
  },
  {
    title: 'AIRPORTS',
    data: [
      {
        key: 'sjc',
        label: 'SJC – San Jose Norman Mineta Airport',
        icon: 'airplane-outline'
      },
    ],
  },
  {
    title: 'CITIES',
    data: [
      { key: 'la', label: 'Los Angeles, CA', icon: 'business-outline' },
      { key: 'sf', label: 'San Francisco, CA', icon: 'business-outline' },
    ],
  },
  {
    title: 'TRAIN STATIONS',
    data: [
      {
        key: 'union',
        label: 'Union Station, Los Angeles',
        icon: 'train-outline'
      },
    ],
  },
];

export default function SearchLocationScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [permGranted, setPermGranted] = useState(false);

  // ask location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermGranted(status === 'granted');
    })();
  }, []);

  async function goCurrentLocation() {
    if (!permGranted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setPermGranted(true);
    }
    const { coords } = await Location.getCurrentPositionAsync();
    navigation.navigate('SearchFilter', { location: coords });
  }

  function onSelect(item) {
    if (item.key === 'current') return goCurrentLocation();
    if (item.key === 'anywhere')
      return navigation.navigate('SearchFilter', { location: 'Anywhere' });
    navigation.navigate('SearchFilter', { location: item.label });
  }

  function onSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigation.navigate('SearchFilter', { location: trimmed });
  }

  return (
    <View style={styles.screen}>
      {/* Search bar + dynamic right button */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search-outline"
          size={20}
          color={GlobalStyles.colors.gray700}
        />
        <TextInput
          style={styles.input}
          placeholder="City, airport, address, or train station"
          placeholderTextColor={GlobalStyles.colors.gray500}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          onPress={query.trim() ? onSubmit : () => navigation.goBack()}
        >
          <Text style={[
            styles.actionText,
            query.trim() ? styles.searchText : styles.cancelText
          ]}>
            {query.trim() ? 'Search' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List of options */}
      <SectionList
        sections={SECTIONS}
        keyExtractor={item => item.key}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => onSelect(item)}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={GlobalStyles.colors.primary500}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              {item.subtitle && (
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: GlobalStyles.colors.gray700,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    fontColor: GlobalStyles.colors.accent500,
  },
  cancelText: {
    color: GlobalStyles.colors.primary500,
  },
  searchText: {
    color: GlobalStyles.colors.accent500,
  },
  sectionHeader: {
    marginTop: 16,
    marginHorizontal: 16,
    color: GlobalStyles.colors.gray500,
    fontSize: 12,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    color: GlobalStyles.colors.gray700,
  },
  itemSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    marginTop: 2,
  },
});
