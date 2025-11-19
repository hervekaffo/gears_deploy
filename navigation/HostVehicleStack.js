import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext }      from '../store/auth-context';
import PostVehicleScreen    from '../screens/PostVehicleScreen';
import VehicleMapScreen     from '../screens/VehicleMapScreen';
import BecomeHostScreen     from '../screens/BecomeHostScreen';
import WelcomeScreen        from '../screens/WelcomeScreen';
import LoginScreen          from '../screens/LoginScreen';
import EmailLoginScreen     from '../screens/EmailLoginScreen';
import SignupScreen         from '../screens/SignupScreen';

const Stack = createNativeStackNavigator();

export default function HostVehicleStack() {
  const { user, profile } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      { !user ? (
        // 1) Not signed in: show welcome → login/signup
        <>
          <Stack.Screen name="Welcome"    component={WelcomeScreen} />
          <Stack.Screen name="Login"      component={LoginScreen} />
          <Stack.Screen
            name="EmailLogin"
            component={EmailLoginScreen}
            options={{ title: 'Log in with Email' }}
          />
          <Stack.Screen name="Signup"     component={SignupScreen} />
        </>
      ) : !profile?.isHost ? (
        // 2) Signed in but not a host: show BecomeHost flow
        <Stack.Screen
          name="BecomeHost"
          component={BecomeHostScreen}
          options={{ headerShown: true, title: 'Become a Host' }}
        />
      ) : (
        // 3) Signed in & isHost: allow posting
        <>
          <Stack.Screen
            name="PostVehicle"
            component={PostVehicleScreen}
            options={{ title: 'List Your Vehicle', headerShown: true }}
          />
          <Stack.Screen
            name="VehicleMap"
            component={VehicleMapScreen}
            options={{ title: 'Pick Location', headerShown: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
