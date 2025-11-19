// navigation/AuthStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GlobalStyles } from '../styles';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailLoginScreen from '../screens/EmailLoginScreen';
import SignupScreen from '../screens/SignupScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.surface },
        headerTintColor: GlobalStyles.colors.onSurface,
        headerTitleStyle: { color: GlobalStyles.colors.onSurface, fontWeight: '700' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} options={{ title: 'Log in with email' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create account' }} />
    </Stack.Navigator>
  );
}
