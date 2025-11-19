// screens/WelcomeScreen.js
import React, { useRef, useEffect } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { GlobalStyles, Tokens } from '../styles';
import { useNavigation } from '@react-navigation/native';

const bg = require('../assets/images/road.png'); // your existing bg image
const logo = require('../assets/icon.png');      // GEARS logo

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
        {/* readability overlay */}
        <View style={styles.scrim} />

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <Text style={styles.heroHeadline}>
            Find your recreational vehicle here.
          </Text>

          <View style={{ height: 24 }} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.9}
            style={Tokens.buttonPrimary.container}
          >
            <Text style={Tokens.buttonPrimary.label}>Sign up</Text>
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
            style={Tokens.buttonOutline.container}
          >
            <Text style={Tokens.buttonOutline.label}>Log in</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GlobalStyles.colors.background },
  bg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,19,22,0.45)', // darken for contrast
  },
  content: {
    width: '86%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  heroHeadline: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#fff',
    textAlign: 'center',
    marginTop: 24,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
  },
});
