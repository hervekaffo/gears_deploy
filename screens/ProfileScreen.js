import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect
} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons }            from '@expo/vector-icons';
import { AuthContext }         from '../store/auth-context';
import { db }                  from '../firebase';
import { doc, onSnapshot }     from 'firebase/firestore';
import { GlobalStyles, Typography } from '../constants/styles';

const AVATAR_SIZE = 140;
const PLACEHOLDER = require('../assets/images/avatar-placeholder.png');
const HOST_IMAGE  = require('../assets/images/people/host.jpg');

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    phone: '',
    about: '',
    photoUrl: null,
    joinedAt: null,
    isHost: false
  });
  const [loading, setLoading] = useState(true);

  // pencil icon in header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="pencil" size={24} color="#fff" />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  // listen to /users/{uid}
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      snap => {
        const data = snap.data() || {};
        setProfile({
          email:    data.email    || user.email,
          name:     data.name     || '',
          phone:    data.phone    || '',
          about:    data.about    || '',
          photoUrl: data.photoUrl || null,
          joinedAt: data.joinedAt?.toDate() || null,
          isHost:   data.isHost   === true
        });
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user.uid]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
      </View>
    );
  }

  // format joined date
  const joinedStr = profile.joinedAt
    ? profile.joinedAt.toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            <Image
              source={profile.photoUrl ? { uri: profile.photoUrl } : PLACEHOLDER}
              style={styles.avatar}
            />
            {profile.isHost && (
              <View style={styles.hostBadge}>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.hostBadgeText}>Host</Text>
              </View>
            )}
          </View>
          <Text style={styles.nameText}>
            {profile.name?.trim() || 'Guest Driver'}
          </Text>
          <Text style={styles.emailText}>{profile.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={18} color={GlobalStyles.colors.primary500} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full name</Text>
              <Text style={styles.infoValue}>{profile.name || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color={GlobalStyles.colors.primary500} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="call-outline" size={18} color={GlobalStyles.colors.primary500} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar-outline" size={18} color={GlobalStyles.colors.primary500} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>Joined {joinedStr}</Text>
            </View>
          </View>
        </View>

        {profile.about ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.aboutText}>{profile.about}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.getParent()?.navigate('My Trips')}
          activeOpacity={0.9}
        >
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={GlobalStyles.colors.onPrimary}
            style={styles.primaryActionIcon}
          />
          <Text style={styles.primaryActionText}>My Trips</Text>
        </TouchableOpacity>

        {profile.isHost ? (
          <>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('PostVehicle')}
              activeOpacity={0.9}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={GlobalStyles.colors.onPrimary}
                style={styles.primaryActionIcon}
              />
              <Text style={styles.primaryActionText}>List a Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('MyListings')}
              activeOpacity={0.9}
            >
              <Ionicons
                name="boat-outline"
                size={20}
                color={GlobalStyles.colors.onPrimary}
                style={styles.primaryActionIcon}
              />
              <Text style={styles.primaryActionText}>My Vehicle Listings</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.card, styles.hostCard]}>
            <Image source={HOST_IMAGE} style={styles.hostImage} />
            <Text style={styles.hostTitle}>Become a Host</Text>
            <Text style={styles.hostPrompt}>
              Share your recreational vehicles with travelers and earn on every adventure.
            </Text>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('BecomeHost')}
              activeOpacity={0.9}
            >
              <Ionicons
                name="star-outline"
                size={20}
                color={GlobalStyles.colors.onPrimary}
                style={styles.primaryActionIcon}
              />
              <Text style={styles.primaryActionText}>Start Hosting</Text>
            </TouchableOpacity>
          </View>
        )}

        {profile.isHost ? (
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('BookingRequests')}
            activeOpacity={0.9}
          >
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={GlobalStyles.colors.primary500}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={styles.secondaryTitle}>Booking requests</Text>
              <Text style={styles.secondarySubtitle}>Review, approve, or decline upcoming trips</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.logout} onPress={signOut}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#fff"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.background,
    justifyContent: 'space-between'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.background
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 56
  },
  hero: {
    backgroundColor: GlobalStyles.colors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 24
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: GlobalStyles.colors.primary500,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 16
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  hostBadge: {
    position: 'absolute',
    bottom: 8,
    right: -4,
    backgroundColor: GlobalStyles.colors.primary500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.background
  },
  hostBadgeText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700'
  },
  nameText: {
    ...Typography.h1,
    color: GlobalStyles.colors.onSurface,
    marginTop: 6
  },
  emailText: {
    ...Typography.body,
    color: GlobalStyles.colors.gray500,
    marginTop: 4
  },
  card: {
    backgroundColor: GlobalStyles.colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignSelf: 'stretch',
    marginBottom: 20
  },
  sectionTitle: {
    ...Typography.h2,
    color: GlobalStyles.colors.onSurface,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.primary500 + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: GlobalStyles.colors.gray600,
    marginBottom: 2,
    fontWeight: '700'
  },
  infoValue: {
    ...Typography.body,
    color: GlobalStyles.colors.onSurface
  },
  aboutText: {
    ...Typography.body,
    color: GlobalStyles.colors.onSurface,
    lineHeight: 24,
    fontSize: 16,
    fontWeight: '600'
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginTop: 4,
    marginBottom: 8,
    alignSelf: 'stretch'
  },
  primaryActionIcon: {
    marginRight: 10
  },
  primaryActionText: {
    color: GlobalStyles.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  secondaryAction:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: GlobalStyles.colors.surface,
    padding:16,
    borderRadius:16,
    shadowColor:'#000',
    shadowOpacity:0.06,
    shadowRadius:8,
    shadowOffset:{ width:0, height:4 },
    elevation:2,
    marginTop:20
  },
  secondaryTitle:{
    fontSize:16,
    fontWeight:'700',
    color:GlobalStyles.colors.gray700
  },
  secondarySubtitle:{
    fontSize:13,
    color:GlobalStyles.colors.gray500,
    marginTop:4
  },
  hostCard: {
    alignItems: 'center',
    gap: 16
  },
  hostImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    resizeMode: 'cover'
  },
  hostTitle: {
    ...Typography.h2,
    color: GlobalStyles.colors.onSurface
  },
  hostPrompt: {
    ...Typography.body,
    color: GlobalStyles.colors.gray600,
    textAlign: 'center'
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GlobalStyles.colors.error500,
    paddingVertical: 16,
    borderRadius: 18,
    marginHorizontal: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  logoutIcon: {
    marginRight: 10
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});
