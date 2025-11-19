import React, { useContext } from 'react';
import { AuthContext } from '../store/auth-context';
import LoginScreen from '../screens/LoginScreen';

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useContext(AuthContext);

  return isAuthenticated ? children : <LoginScreen />;
}
