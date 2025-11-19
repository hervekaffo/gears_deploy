import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlobalStyles } from '../constants/styles';

import MyTripsScreen from '../screens/MyTripsScreen';
import EditTripScreen from '../screens/EditTripScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import VehicleMapScreen from '../screens/VehicleMapScreen';

const Stack = createNativeStackNavigator();

export default function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: GlobalStyles.colors.primary50 },
      }}
    >
      <Stack.Screen
        name="TripsMain"
        component={MyTripsScreen}
        options={{ title: 'My Trips' }}
      />
      <Stack.Screen
        name="EditTrip"
        component={EditTripScreen}
        options={{ title: 'Edit Trip Request' }}
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
