// App.js
import 'react-native-url-polyfill/auto';
import React, { useEffect, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import AuthContextProvider, { AuthContext } from './store/auth-context';
import { VehicleContextProvider } from './store/vehicle-context';
import { BookingsContextProvider } from './store/bookings-context';
import { FavoritesContextProvider } from './store/favorites-context';
import AppTabs from './navigation/AppTabs';
import AuthStack from './navigation/AuthStack';
import { GearsTheme } from './styles';
import { MessagesContextProvider } from './store/messages-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Root = createNativeStackNavigator();

function RootNavigator() {
  // If you need it inside listeners:
  const auth = useContext(AuthContext);

  return (
    <NavigationContainer theme={GearsTheme}>
      <StatusBar style="light" />
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {/* Tabs are always visible */}
        <Root.Screen name="Tabs" component={AppTabs} />
        {/* Auth shown as a modal sheet on top of Tabs */}
        <Root.Screen
          name="Auth"
          component={AuthStack}
          options={{ presentation: 'modal' }}
        />
      </Root.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '👋 Hello!',
            body: 'Notification sent from Gears App',
            sound: true,
          },
          trigger: null,
        });
      }
    })();
  }, []);

  return (
    <AuthContextProvider>
      <FavoritesContextProvider>
        <VehicleContextProvider>
          <BookingsContextProvider>
            <MessagesContextProvider>
              <RootNavigator />
            </MessagesContextProvider>
          </BookingsContextProvider>
        </VehicleContextProvider>
      </FavoritesContextProvider>
    </AuthContextProvider>
  );
}
