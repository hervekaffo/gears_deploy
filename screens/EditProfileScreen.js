import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView }                 from 'react-native-safe-area-context';
import { Ionicons }                     from '@expo/vector-icons';
import * as ImagePicker                 from 'expo-image-picker';
import { doc, getDoc, updateDoc }       from 'firebase/firestore';
import { AuthContext }                  from '../store/auth-context';
import { db }                           from '../firebase';
import uploadImageAsync                 from '../util/uploadImageAsync';
import { GlobalStyles, Typography }     from '../constants/styles';

const AVATAR_SIZE = 120;

export default function EditProfileScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [about, setAbout]   = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);

  // load current profile
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setPhone(data.phone || '');
          setAbout(data.about || '');
          setPhotoUrl(data.photoUrl || null);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.uid]);

  // handle camera / gallery
  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.7,
    });
    if (!result.canceled) {
      await uploadAndSet(result.assets?.[0]?.uri ?? result.uri);
    }
    setModalVisible(false);
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.7,
    });
    if (!result.canceled) {
      await uploadAndSet(result.assets?.[0]?.uri ?? result.uri);
    }
    setModalVisible(false);
  }

  async function uploadAndSet(uri) {
    try {
      const url = await uploadImageAsync(uri, {
        folder: 'profile-avatars',
        publicId: `profile_${user.uid}`,
        resourceType: 'image',
      });
      setPhotoUrl(url);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not upload image.');
    }
  }

  async function handleSave() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing fields', 'Please fill in name and phone.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        about: about.trim(),
        photoUrl: photoUrl || null
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save changes.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal for choosing image */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={()=>setModalVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={pickFromCamera}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonOutline]}
              onPress={pickFromLibrary}
            >
              <Ionicons name="images-outline" size={20} color={GlobalStyles.colors.primary500} />
              <Text style={[styles.modalButtonText, { color: GlobalStyles.colors.primary500 }]}>
                Pick Image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={()=>setModalVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={{ color: GlobalStyles.colors.error500 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.h1}>Edit Profile</Text>

        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={()=>setModalVisible(true)}
        >
          <Image
            source={photoUrl ? { uri: photoUrl } : require('../assets/images/avatar-placeholder.png')}
            style={styles.avatar}
          />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 405-555-1234"
            keyboardType={Platform.OS==='ios'?'phone-pad':'numeric'}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>About</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={about}
            onChangeText={setAbout}
            placeholder="Tell us a little more about yourself"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.helperText}>
            This is your public bio—let others know who you are!
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  content: {
    padding: 24,
    alignItems: 'center'
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE/2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary500,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: GlobalStyles.colors.primary500,
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff'
  },
  field: {
    width: '100%',
    marginBottom: 16
  },
  label: {
    ...Typography.h3,
    marginBottom: 6,
    color: GlobalStyles.colors.gray700
  },
  input: {
    backgroundColor: '#fff',
    borderColor: GlobalStyles.colors.gray500,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: GlobalStyles.colors.gray700
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: GlobalStyles.colors.gray500
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    marginTop: 24
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // ——— modal styles ———
  backdrop: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.4)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalBox: {
    width:'80%',
    backgroundColor:'#fff',
    borderRadius:12,
    padding:20,
    alignItems:'center'
  },
  modalTitle: {
    ...Typography.h3,
    marginBottom:12,
    color:GlobalStyles.colors.primary700
  },
  modalButton: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:GlobalStyles.colors.primary500,
    paddingVertical:10,
    paddingHorizontal:20,
    borderRadius:6,
    width:'100%',
    justifyContent:'center',
    marginBottom:12
  },
  modalButtonOutline: {
    backgroundColor:'#fff',
    borderWidth:1,
    borderColor:GlobalStyles.colors.primary500
  },
  modalButtonText: {
    color:'#fff',
    fontSize:16,
    fontWeight:'600',
    marginLeft:8
  },
  modalCancel: {
    marginTop:8
  }
});
