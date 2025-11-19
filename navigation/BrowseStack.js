import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlobalStyles }               from '../constants/styles';

import HomeScreen           from '../screens/HomeScreen';
import SearchLocationScreen from '../screens/SearchLocationScreen';
import SearchFilterScreen   from '../screens/SearchFilterScreen';
import VehicleDetailScreen  from '../screens/VehicleDetailScreen';
import VehicleMapScreen     from '../screens/VehicleMapScreen';

const Stack = createNativeStackNavigator();

export default function BrowseStack() {
  return (
    <Stack.Navigator
      initialRouteName="Browse"
      screenOptions={{
        headerStyle:   { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: 'white',
        contentStyle:  { backgroundColor: GlobalStyles.colors.primary50 }
      }}
    >
      <Stack.Screen
        name="Browse"
        component={HomeScreen}
        options={{ title:'Browse Vehicles' }}
      />
      <Stack.Screen
        name="SearchLocation"
        component={SearchLocationScreen}
        options={{
          title:'Where to?',
          headerStyle:{ backgroundColor:'#fff' },
          headerTintColor:GlobalStyles.colors.primary700
        }}
      />
      <Stack.Screen
        name="SearchFilter"
        component={SearchFilterScreen}
        options={{
          title:'When & Who',
          headerStyle:{ backgroundColor:'#fff' },
          headerTintColor:GlobalStyles.colors.primary700
        }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title:'Vehicle Details' }}
      />
      <Stack.Screen
        name="VehicleMap"
        component={VehicleMapScreen}
        options={{ title:'Vehicle Map' }}
      />
    </Stack.Navigator>
  );
}
