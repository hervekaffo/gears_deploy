import React, { useContext }  from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen      from '../screens/WelcomeScreen';
import LoginScreen        from '../screens/LoginScreen';
import SignupScreen       from '../screens/SignupScreen';

import ProfileScreen      from '../screens/ProfileScreen';
import EditProfileScreen  from '../screens/EditProfileScreen';
import BecomeHostScreen   from '../screens/BecomeHostScreen';
import MyListingsScreen   from '../screens/MyListingsScreen';
import EditVehicleScreen from '../screens/EditVehicleScreen';
import BookingRequestsScreen from '../screens/BookingRequestsScreen';
import PostVehicleScreen from '../screens/PostVehicleScreen';

import { AuthContext }    from '../store/auth-context';
import { GlobalStyles }   from '../constants/styles';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: 'white',
        headerStyle:     { backgroundColor: GlobalStyles.colors.primary500 },
        contentStyle:    { backgroundColor: GlobalStyles.colors.primary50 },
      }}
    >
      { !user ? (
        // UNAUTHENTICATED
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown:false }}/>
          <Stack.Screen name="Login"   component={LoginScreen}   options={{ title:'Log in' }}/>
          <Stack.Screen name="Signup"  component={SignupScreen}  options={{ title:'Sign up' }}/>
        </>
      ) : (
        // AUTHENTICATED
        <>
          <Stack.Screen
            name="ProfileMain"
            component={ProfileScreen}
            options={{ title:'Profile' }}
          />

          {/* Let non-hosts sign up */}
          <Stack.Screen
            name="BecomeHost"
            component={BecomeHostScreen}
            options={{ title:'Become a Host' }}
          />

          {/* Hosts manage their vehicles */}
          <Stack.Screen
            name="MyListings"
            component={MyListingsScreen}
            options={{ title:'My Listings' }}
          />
          <Stack.Screen
            name="EditVehicle"
            component={EditVehicleScreen}
            options={{ title:'Edit Vehicle' }}
          />
          <Stack.Screen
            name="BookingRequests"
            component={BookingRequestsScreen}
            options={{ title:'Booking Requests' }}
          />
          <Stack.Screen
            name="PostVehicle"
            component={PostVehicleScreen}
            options={{ title:'List a Vehicle' }}
          />

          {/* Profile editing */}
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title:'Edit Profile' }}
          />
        </>
      ) }
    </Stack.Navigator>
  );
}
