// navigation/AppTabs.js
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyles } from '../styles';
import { AuthContext } from '../store/auth-context';
import { MessagesContext } from '../store/messages-context';

import BrowseStack from './BrowseStack';
import FavoritesStack from './FavoritesStack';
import TripsStack from './TripsStack';
import InboxStack from './InboxStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const auth = useContext(AuthContext);
  const isSignedIn = !!auth?.isAuthenticated;
  const { unreadCount } = useContext(MessagesContext);
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.surface,
          borderTopColor: GlobalStyles.colors.border,
          height: 64, paddingBottom: 8, paddingTop: 6,
        },
        tabBarActiveTintColor: GlobalStyles.colors.primary500,
        tabBarInactiveTintColor: GlobalStyles.colors.gray600,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIcon: ({ focused, color }) => {
          const map = {
            Browse: focused ? 'search' : 'search-outline',
            Favorites: focused ? 'heart' : 'heart-outline',
            'My Trips': focused ? 'briefcase' : 'briefcase-outline',
            Inbox: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={map[route.name] || 'ellipse'} size={26} color={color} />;
        },
        tabBarBadge: route.name === 'Inbox' && unreadCount > 0 ? unreadCount : undefined,
      })}
      // Intercept presses on protected tabs
      screenListeners={{
        tabPress: (e) => {
          const protectedTabs = ['Favorites', 'My Trips', 'Inbox', 'Profile'];
          const target = e?.target; // tab route key
          // Find the route name by key
          const state = navigation.getState();
          const route = state.routes.find(r => r?.key === target);
          const name = route?.name;

          if (!isSignedIn && protectedTabs.includes(name)) {
            e.preventDefault();
            navigation.navigate('Auth', { screen: 'Login' });
          }
        },
      }}
    >
      <Tab.Screen name="Browse" component={BrowseStack} />
      <Tab.Screen name="Favorites" component={FavoritesStack} />
      <Tab.Screen name="My Trips" component={TripsStack} />
      <Tab.Screen
        name="Inbox"
        component={InboxStack}
        options={{
          tabBarBadge: isSignedIn && inboxCount > 0
            ? Math.min(inboxCount, 99)
            : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
