import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlobalStyles }               from '../constants/styles';

import FavoritesScreen from '../screens/FavoritesScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import VehicleMapScreen    from '../screens/VehicleMapScreen';

const Stack = createNativeStackNavigator();

export default function FavoritesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:    { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor:'white',
        contentStyle:   { backgroundColor: GlobalStyles.colors.primary50 }
      }}
    >
      <Stack.Screen
        name="FavoritesMain"
        component={FavoritesScreen}
        options={{ title: 'Your Favorites' }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title: 'Vehicle Details' }}
      />
      <Stack.Screen
        name="VehicleMap"
        component={VehicleMapScreen}
        options={{ title: 'Vehicle Map' }}
      />
    </Stack.Navigator>
  );
}
