import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BookingsContext } from '../store/bookings-context';
import { GlobalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';

function Section({ title, data, emptyLabel, actions, onMessage }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!data.length ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        data.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.vehicle}>{item.vehicleTitle || 'Vehicle'}</Text>
              <Text style={styles.date}>
                {new Date(item.start).toLocaleDateString()} → {new Date(item.end).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.meta}>Renter: {item.renterId}</Text>
            <Text style={styles.meta}>Guests: {item.guests ?? '—'}</Text>
            <Text style={styles.meta}>Quote: ${item.quotedTotal} / {item.nights} night(s)</Text>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            <View style={styles.actionsRow}>
              {actions.map(action => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.actionBtn, action.variant === 'ghost' && styles.ghostBtn]}
                  onPress={() => action.onPress(item.id)}
                >
                  <Ionicons name={action.icon} size={16} color={action.color} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionText, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
              {typeof onMessage === 'function' && item.status !== 'canceled' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.messageBtn]}
                  onPress={() => onMessage(item)}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color={GlobalStyles.colors.primary500}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.actionText, { color: GlobalStyles.colors.primary500 }]}>
                    Message renter
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export default function BookingRequestsScreen({ navigation }) {
  const {
    hostBookings,
    approveBooking,
    declineBooking,
    markCompleted,
  } = useContext(BookingsContext);

  const grouped = useMemo(() => {
    const group = {
      requested: [],
      upcoming: [],
      active: [],
      completed: [],
      canceled: [],
    };
    hostBookings.forEach(booking => {
      if (booking.status === 'requested') group.requested.push(booking);
      else if (booking.status === 'approved') group.upcoming.push(booking);
      else if (booking.status === 'active') group.active.push(booking);
      else if (booking.status === 'completed') group.completed.push(booking);
      else if (booking.status === 'canceled') group.canceled.push(booking);
    });
    return group;
  }, [hostBookings]);

  function handleMessage(booking) {
    if (!booking?.id) return;
    const parentNav = typeof navigation.getParent === 'function' ? navigation.getParent() : null;
    if (parentNav) {
      parentNav.navigate('Inbox', {
        screen: 'ChatThread',
        params: { threadId: booking.id },
      });
    } else {
      navigation.navigate('ChatThread', { threadId: booking.id });
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Section
        title="New requests"
        data={grouped.requested}
        emptyLabel="No pending requests right now."
        actions={[
          { label: 'Approve', icon: 'checkmark-circle-outline', onPress: approveBooking, color: '#22c55e' },
          { label: 'Decline', icon: 'close-circle-outline', onPress: declineBooking, color: '#ef4444', variant: 'ghost' },
        ]}
        onMessage={handleMessage}
      />
      <Section
        title="Upcoming trips"
        data={grouped.upcoming}
        emptyLabel="No upcoming trips yet."
        actions={[]}
        onMessage={handleMessage}
      />
      <Section
        title="Active trips"
        data={grouped.active}
        emptyLabel="No trips in progress."
        actions={[
          { label: 'Mark completed', icon: 'flag-outline', onPress: markCompleted, color: GlobalStyles.colors.primary500 },
        ]}
        onMessage={handleMessage}
      />
      <Section
        title="Completed"
        data={grouped.completed}
        emptyLabel="Completed trips will appear here."
        actions={[]}
        onMessage={handleMessage}
      />
      <Section
        title="Canceled"
        data={grouped.canceled}
        emptyLabel="Canceled requests will appear here."
        actions={[]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
    marginBottom: 12,
  },
  emptyText: {
    color: GlobalStyles.colors.gray500,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicle: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  date: {
    fontSize: 13,
    color: GlobalStyles.colors.gray500,
  },
  meta: {
    fontSize: 13,
    color: GlobalStyles.colors.gray600,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  note:{
    marginTop:6,
    fontSize:13,
    color:GlobalStyles.colors.gray600,
    fontStyle:'italic'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  ghostBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  messageBtn: {
    backgroundColor: GlobalStyles.colors.primary100,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
