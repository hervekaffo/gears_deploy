import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView }             from 'react-native-safe-area-context';
import { Ionicons }                 from '@expo/vector-icons';
import { AuthContext }              from '../store/auth-context';
import { GlobalStyles, Typography } from '../constants/styles';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

export default function BecomeHostScreen({ navigation }) {
  const { profile, updateProfile } = useContext(AuthContext);
  const [about, setAbout]   = useState(profile.hostAbout || '');
  const [city,  setCity]    = useState(profile.hostCity  || '');
  const [saving, setSaving]= useState(false);

  async function handleSubmit() {
    if (!about.trim() || !city.trim()) {
      Alert.alert('Missing fields','Tell us about yourself and your city.');
      return;
    }
    setSaving(true);
    try {
      // set Firestore isHost + hostAbout/City/Since
      await updateProfile({
        isHost:    true,
        hostAbout: about.trim(),
        hostCity:  city.trim(),
        hostSince: new Date()
      });
      // now we have a host flag, jump to MyListings
      navigation.replace('MyListings');
    } catch (e) {
      console.error(e);
      Alert.alert('Error','Could not complete your request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text style={Typography.h1}>Become a Host</Text>
        <Image
          source={require('../assets/images/people/host.jpg')}
          style={styles.image}
        />
        <Text style={styles.description}>
          Share your recreational vehicles and earn extra income. A few details to get you started:
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Your City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. San Francisco"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tell us About You</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why do you want to host?"
            value={about}
            onChangeText={setAbout}
            multiline
          />
          <Text style={styles.hint}>
            A short bio helps renters feel comfortable booking.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff"/>
            : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitText}>Submit</Text>
              </>
            )
          }
        </TouchableOpacity>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: GlobalStyles.colors.primary50 },
  content:   { padding:24, alignItems:'center' },
  image:     { width:'100%', height:180, borderRadius:12, marginVertical:16 },
  description:{
    textAlign:'center',
    color: GlobalStyles.colors.gray700,
    marginBottom:24,
    fontSize:16
  },
  field:     { width:'100%', marginBottom:16 },
  label:     {
    ...Typography.h3,
    color: GlobalStyles.colors.gray700,
    marginBottom:6
  },
  input:     {
    backgroundColor:'#fff',
    borderColor:GlobalStyles.colors.gray500,
    borderWidth:1,
    borderRadius:6,
    padding:12,
    fontSize:16
  },
  textArea:  { minHeight:100, textAlignVertical:'top' },
  hint:      {
    marginTop:4,
    fontSize:12,
    color:GlobalStyles.colors.gray500
  },
  submitBtn: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: GlobalStyles.colors.accent500,
    paddingVertical:14,
    paddingHorizontal:32,
    borderRadius:6,
    marginTop:24
  },
  submitText:{
    color:'#fff',
    fontSize:16,
    fontWeight:'600'
  }
});
