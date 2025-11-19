import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../store/auth-context';
import { GlobalStyles, Typography } from '../constants/styles';

export default function RequireAuth({ children }) {
  const { user }   = useContext(AuthContext);
  const nav        = useNavigation();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sign in Required</Text>
        <Text style={styles.body}>
          You must be logged in to view this screen.
        </Text>
        <Button
          title="Login / Sign Up"
          color={GlobalStyles.colors.primary500}
          onPress={() =>
            nav.navigate('Login', { returnToPrevious: true })
          }
        />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex:1, justifyContent:'center', alignItems:'center',
    padding:32, backgroundColor: GlobalStyles.colors.primary50
  },
  title: {...Typography.h1, color:GlobalStyles.colors.primary500, marginBottom:12},
  body:  {...Typography.body, textAlign:'center', marginBottom:20}
});
