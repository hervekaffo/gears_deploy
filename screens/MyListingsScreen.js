import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { VehicleContext } from '../store/vehicle-context';
import { AuthContext } from '../store/auth-context';
import { GlobalStyles } from '../constants/styles';
import VehicleCard from '../components/VehicleCard';

export default function MyListingsScreen({ navigation }) {
  const { deleteVehicle } = useContext(VehicleContext);
  const { profile, user }   = useContext(AuthContext);
  const [myVehicles, setMyVehicles] = useState([]);
  const ownerId = user?.uid;
  const isHost = useMemo(() => profile?.isHost === true, [profile]);

  const stats = useMemo(() => {
    if (!myVehicles.length) {
      return null;
    }
    const totalRate = myVehicles.reduce((sum, v) => sum + (parseFloat(v.dailyRate ?? v.price) || 0), 0);
    const totalCapacity = myVehicles.reduce((sum, v) => sum + (parseInt(v.capacity ?? v.seats, 10) || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const availableToday = myVehicles.filter(v => {
      const start = v.availability?.start;
      const end = v.availability?.end;
      if (!start || !end) return true;
      return start <= today && end >= today;
    }).length;
    return {
      count: myVehicles.length,
      avgRate: Math.round(totalRate / myVehicles.length) || 0,
      capacity: totalCapacity,
      availableToday,
    };
  }, [myVehicles]);

  function handlePostVehicleNavigation() {
    const parentNavigator = navigation.getParent();
    if (parentNavigator?.navigate) {
      parentNavigator.navigate('List Vehicle');
    } else {
      console.warn('Unable to find parent tab navigator for List Vehicle route.');
    }
  }

  useEffect(() => {
    if (!ownerId) return;

    const q = query(
      collection(db, 'cars'),
      where('ownerId', '==', ownerId)
    );
    const unsub = onSnapshot(q, snap => {
      setMyVehicles(snap.docs.map(d => ({
        id:    d.id,
        ...d.data(),
        image: d.data().imageUrl ? { uri: d.data().imageUrl } : null
      })));
    });
    return unsub;
  }, [ownerId]);

  function confirmDelete(id) {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVehicle(id) }
    ]);
  }

  // 0) Not signed in
  if (!user) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Sign in to manage listings</Text>
        <Text style={styles.emptySub}>
          Log in to view and edit the vehicles you’ve listed.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.getParent?.()?.navigate?.('Auth', { screen: 'Login' })}
        >
          <Ionicons
            name="log-in-outline"
            size={20}
            color={GlobalStyles.colors.onPrimary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.ctaText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 1) Profile still loading
  if (!profile) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={[styles.emptySub, { marginTop: 16 }]}>
          Loading your profile…
        </Text>
      </View>
    );
  }

  // 2) Signed in but not a host yet
  if (!isHost) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>You’re not a host yet</Text>
        <Text style={styles.emptySub}>
          Become a host to list your recreational vehicle & earn extra income.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('BecomeHost')}
        >
          <Ionicons
            name="boat-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.ctaText}>Become a Host</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3) Host but no vehicles
  if (myVehicles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No vehicles listed yet</Text>
        <Text style={styles.emptySub}>
          You’re all set as a host—list your first vehicle now!
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handlePostVehicleNavigation}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.ctaText}>List Your First Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4) Host with listings
  function renderItem({ item }) {
    return (
      <View style={styles.cardBox}>
        <VehicleCard
          vehicle={item}
          onPress={() => navigation.navigate('EditVehicle', { vehicle: item })}
        />
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.edit]}
            onPress={() => navigation.navigate('EditVehicle', { vehicle: item })}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.delete]}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myVehicles}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={stats ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{stats.count}</Text>
                <Text style={styles.summaryLabel}>Active vehicles</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>${stats.avgRate}</Text>
                <Text style={styles.summaryLabel}>Avg. daily rate</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{stats.capacity}</Text>
                <Text style={styles.summaryLabel}>Total seats</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{stats.availableToday}</Text>
                <Text style={styles.summaryLabel}>Available today</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.summaryCta}
              onPress={handlePostVehicleNavigation}
              activeOpacity={0.9}
            >
              <Ionicons name="add-circle-outline" size={18} color={GlobalStyles.colors.primary500} style={{ marginRight:8 }} />
              <Text style={styles.summaryCtaText}>List another vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />

      {/* ─── Floating + Button ─── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handlePostVehicleNavigation}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  emptySub: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 6
  },
  ctaText: {
    color: GlobalStyles.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  list: {
    padding: 12
  },
  summaryCard: {
    backgroundColor:'#fff',
    borderRadius:14,
    padding:16,
    marginBottom:16,
    shadowColor:'#000',
    shadowOpacity:0.08,
    shadowRadius:10,
    shadowOffset:{ width:0, height:6 },
    elevation:3
  },
  summaryRow: {
    flexDirection:'row',
    justifyContent:'space-between',
    marginBottom:12
  },
  summaryStat: {
    flex:1
  },
  summaryValue: {
    fontSize:20,
    fontWeight:'800',
    color:GlobalStyles.colors.gray700
  },
  summaryLabel: {
    fontSize:12,
    color:GlobalStyles.colors.gray500,
    marginTop:4
  },
  summaryCta: {
    marginTop:4,
    alignSelf:'flex-start',
    flexDirection:'row',
    alignItems:'center'
  },
  summaryCtaText: {
    color:GlobalStyles.colors.primary500,
    fontWeight:'700'
  },
  cardBox: {
    marginBottom: 16
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  edit: { backgroundColor: '#ff9500' },
  delete: { backgroundColor: '#e24a4a' },
  btnText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: GlobalStyles.colors.primary500,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,                // Android shadow
    shadowColor: '#000',         // iOS shadow
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  }
});
