import React, { useState, useMemo, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyles, Tokens } from '../styles';
import { AuthContext } from '../store/auth-context';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

export default function SignupScreen() {
  const nav  = useNavigation();
  const auth = useContext(AuthContext) || {};

  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const disabled = useMemo(() => !email || !pass || pass !== confirm || loading, [email, pass, confirm, loading]);
  const closeAuthModal = () => nav.getParent?.()?.goBack?.();

  const handleSignup = async () => {
    setErr('');
    const e = (email || '').trim();
    const p = String(pass || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Enter a valid email address'); return; }
    if (p.length < 6)                           { setErr('Password must be at least 6 characters'); return; }
    if (p !== confirm)                          { setErr('Passwords do not match'); return; }

    setLoading(true);
    try {
      await auth.signUp(e, p);                  // ✅ two strings
      closeAuthModal();
    } catch (error) {
      const msg = String(error?.message || error);
      if (msg.includes('auth/email-already-in-use')) setErr('Email already in use');
      else setErr(msg.replace(/^Firebase:\s*/i, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.card}>
          <Text style={Tokens.h1}>CAR RENTAL MADE EASY</Text>

          <View style={{ height: 16 }} />

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={GlobalStyles.colors.gray600} style={{ marginRight: 8 }} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Tokens.inputPlaceholder}
              style={Tokens.inputText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={GlobalStyles.colors.gray600} style={{ marginRight: 8 }} />
            <TextInput
              value={pass}
              onChangeText={setPass}
              placeholder="Password"
              placeholderTextColor={Tokens.inputPlaceholder}
              style={Tokens.inputText}
              secureTextEntry
            />
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={GlobalStyles.colors.gray600} style={{ marginRight: 8 }} />
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm Password"
              placeholderTextColor={Tokens.inputPlaceholder}
              style={Tokens.inputText}
              secureTextEntry
            />
          </View>

          {!!err && <Text style={{ color: '#ff6b6b', marginTop: 8 }}>{err}</Text>}

          <View style={{ height: 16 }} />

          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.9}
            style={disabled ? Tokens.buttonPrimaryDisabled.container : Tokens.buttonPrimary.container}
            onPress={handleSignup}
          >
            {loading
              ? <ActivityIndicator color={GlobalStyles.colors.onPrimary} />
              : <Text style={disabled ? Tokens.buttonPrimaryDisabled.label : Tokens.buttonPrimary.label}>Create Account</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={() => nav.navigate('Login')}>
            <Text style={Tokens.caption}>
              <Text style={{ color: GlobalStyles.colors.gray500 }}>Back to </Text>
              <Text style={Tokens.link}>Login</Text>
            </Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GlobalStyles.colors.background },
  container: { padding: GlobalStyles.spacing(2) },
  card: { ...Tokens.card },
  inputRow: { ...Tokens.inputContainer, flexDirection: 'row', alignItems: 'center' },
});
