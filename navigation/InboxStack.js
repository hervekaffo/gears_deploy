import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../screens/InboxScreen';
import ThreadScreen from '../screens/ThreadScreen.js';

const Stack = createNativeStackNavigator();

export default function InboxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxMain" component={InboxScreen} />
      <Stack.Screen
        name="ChatThread"
        component={ThreadScreen}
        options={{ headerShown: true, title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}
