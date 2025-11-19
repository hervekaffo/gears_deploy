import React, { useContext } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { FavoritesContext } from '../store/favorites-context';
import VehicleCard          from '../components/VehicleCard';
import { GlobalStyles }     from '../constants/styles';

export default function FavoritesScreen({ navigation }) {
  const { favorites } = useContext(FavoritesContext);

  if (favorites.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>You haven’t favorited any vehicles yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={c => c.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <VehicleCard
          vehicle={item}
          onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  empty: {
    color: GlobalStyles.colors.gray500,
    fontSize: 16
  }
});
