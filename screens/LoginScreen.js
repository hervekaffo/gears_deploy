import React, { useState, useMemo, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyles, Tokens } from '../styles';
import { AuthContext } from '../store/auth-context';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

function OutlineButton({ onPress, icon, label, disabled }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.9}
      style={[Tokens.buttonOutline.container, styles.btnRow, disabled && { opacity: 0.6 }]}
    >
      <View style={styles.btnIconBox}>{icon}</View>
      <Text style={[Tokens.buttonOutline.label, styles.btnLabel]}>{label}</Text>
      <View style={styles.btnIconBox} />
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const nav  = useNavigation();
  const auth = useContext(AuthContext) || {};
  const [country, setCountry] = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const disabled = useMemo(() => !country || !phone || loading, [country, phone, loading]);
  const closeAuthModal = () => nav.getParent?.()?.goBack?.();

  return (
    <KeyboardAvoidingWrapper style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.card}>
          <Text style={Tokens.h1}>Log in</Text>

          <View style={styles.gap16} />

          <Text style={Tokens.caption}>Country code</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="earth" size={18} color={GlobalStyles.colors.gray600} style={styles.icon} />
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. United States +1"
              placeholderTextColor={Tokens.inputPlaceholder}
              style={Tokens.inputText}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.gap12} />

          <Text style={Tokens.caption}>Phone number</Text>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color={GlobalStyles.colors.gray600} style={styles.icon} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor={Tokens.inputPlaceholder}
              style={Tokens.inputText}
              keyboardType="phone-pad"
            />
          </View>

          {!!err && <Text style={{ color: '#ff6b6b', marginTop: 8 }}>{err}</Text>}

          <View style={styles.gap16} />

          {/* Since phone auth isn't in context yet, direct to Email Login */}
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.9}
            style={disabled ? Tokens.buttonPrimaryDisabled.container : Tokens.buttonPrimary.container}
            onPress={() => nav.getParent?.()?.navigate?.('Auth', { screen: 'EmailLogin' })}
          >
            {loading
              ? <ActivityIndicator color={GlobalStyles.colors.onPrimary} />
              : <Text style={disabled ? Tokens.buttonPrimaryDisabled.label : Tokens.buttonPrimary.label}>Continue</Text>
            }
          </TouchableOpacity>

          <View style={styles.rowSep}>
            <View style={Tokens.divider} />
            <Text style={[Tokens.caption, { marginHorizontal: 12 }]}>Or</Text>
            <View style={Tokens.divider} />
          </View>

          {/* Continue with email */}
          <OutlineButton
            onPress={() => {
              const state = nav.getState?.();
              if (state?.routeNames?.includes?.('EmailLogin')) nav.navigate('EmailLogin');
              else nav.getParent?.()?.navigate?.('Auth', { screen: 'EmailLogin' });
            }}
            icon={<Ionicons name="mail-outline" size={18} color={GlobalStyles.colors.onSurface} />}
            label="Continue with email"
          />

          <View style={styles.gap12} />

          {/* Continue with Apple */}
          <OutlineButton
            onPress={async () => {
              try {
                if (auth.signInWithApple) { await auth.signInWithApple(); closeAuthModal(); }
                else console.warn('signInWithApple not implemented');
              } catch (e) { setErr(e?.message ?? 'Apple sign-in failed'); }
            }}
            icon={<Ionicons name="logo-apple" size={20} color={GlobalStyles.colors.onSurface} />}
            label="Continue with Apple"
          />

          <View style={styles.gap12} />

          {/* Continue with Google */}
          <OutlineButton
            onPress={async () => {
              try {
                await auth.signInWithGoogle();       // your context (expo-auth-session)
                closeAuthModal();
              } catch (e) {
                setErr(e?.message ?? 'Google sign-in failed');
              }
            }}
            icon={
              <Image
                source={require('../assets/images/google.png')}
                style={{ width: 20, height: 20, borderRadius: 2 }}
                resizeMode="contain"
              />
            }
            label="Continue with Google"
          />

          <View style={styles.gap16} />

          <Text style={Tokens.caption}>
            Don’t have an account?{' '}
            <Text
              onPress={() => {
                const state = nav.getState?.();
                if (state?.routeNames?.includes?.('Signup')) nav.navigate('Signup');
                else nav.getParent?.()?.navigate?.('Auth', { screen: 'Signup' });
              }}
              style={Tokens.link}
            >
              Sign up
            </Text>
          </Text>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GlobalStyles.colors.background },
  container: { padding: GlobalStyles.spacing(2) },
  card: { ...Tokens.card },
  inputRow: { ...Tokens.inputContainer, flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  rowSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  btnIconBox: { width: 22, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { flex: 1, textAlign: 'center' },
});
