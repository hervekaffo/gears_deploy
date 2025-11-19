import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BookingsContext } from '../store/bookings-context';
import { GlobalStyles } from '../constants/styles';

const STATUS_LABELS = {
  requested: 'Awaiting host',
  approved: 'Approved',
  active: 'Active trip',
  completed: 'Completed',
  canceled: 'Canceled',
};

const STATUS_COLORS = {
  requested: '#f59e0b',
  approved: '#22c55e',
  active: '#16a34a',
  completed: '#64748b',
  canceled: '#ef4444',
};

function TripCard({ booking, onCancel, onEdit, onMessage }) {
  const {
    vehicleTitle,
    start,
    end,
    quotedTotal,
    nights,
    paymentStatus,
    guests,
    note,
    status,
  } = booking;

  const statusColor = STATUS_COLORS[status] || GlobalStyles.colors.gray600;
  const canEdit = status === 'requested';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleTitle}>{vehicleTitle || 'Vehicle'}</Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {STATUS_LABELS[status] || status}
        </Text>
      </View>

      <Text style={styles.date}>
        {new Date(start).toLocaleDateString()} → {new Date(end).toLocaleDateString()}
      </Text>
      <Text style={styles.total}>${quotedTotal} total · {nights} night(s)</Text>
      <Text style={styles.meta}>Payment: {paymentStatus === 'simulated_paid' ? 'Paid (Simulated)' : (paymentStatus || 'pending')}</Text>
      <Text style={styles.meta}>Guests: {guests ?? '—'}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}

      <View style={styles.actionsRow}>
        {canEdit && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(booking)}>
            <Ionicons
              name="pencil-outline"
              size={16}
              color={GlobalStyles.colors.primary500}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.actionEditText}>Edit request</Text>
          </TouchableOpacity>
        )}
        {status === 'requested' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onCancel(booking)}>
            <Ionicons
              name="close-circle-outline"
              size={16}
              color="#ef4444"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.actionCancelText}>Cancel request</Text>
          </TouchableOpacity>
        )}
        {booking.status !== 'canceled' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onMessage(booking)}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={GlobalStyles.colors.primary500}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.actionMessageText}>Message host</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MyTripsScreen({ navigation }) {
  const { myBookings, cancelBooking } = useContext(BookingsContext);

  const grouped = useMemo(() => {
    const buckets = {
      upcoming: [],
      active: [],
      completed: [],
      canceled: [],
    };

    myBookings.forEach(booking => {
      if (booking.status === 'active') {
        buckets.active.push(booking);
      } else if (booking.status === 'completed') {
        buckets.completed.push(booking);
      } else if (booking.status === 'canceled') {
        buckets.canceled.push(booking);
      } else {
        buckets.upcoming.push(booking);
      }
    });

    return buckets;
  }, [myBookings]);

  function handleCancelRequest(booking) {
    Alert.alert(
      'Cancel this trip?',
      'This will withdraw your request. Hosts will no longer see it in their queue.',
      [
        { text: 'Keep trip', style: 'cancel' },
        {
          text: 'Cancel trip',
          style: 'destructive',
          onPress: () => cancelBooking(booking.id),
        },
      ]
    );
  }

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

  function renderSection(title, key, emptyMessage) {
    const items = grouped[key];
    if (!items.length) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map(booking => (
          <TripCard
            key={booking.id}
            booking={booking}
            onCancel={handleCancelRequest}
            onEdit={(b) => navigation.navigate('EditTrip', { bookingId: b.id })}
            onMessage={handleMessage}
          />
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {renderSection('Upcoming trips', 'upcoming', 'No upcoming reservations yet.')}
      {renderSection('Active trips', 'active', 'No active trips right now.')}
      {renderSection('Completed trips', 'completed', 'Completed trips will appear here.')}
      {renderSection('Canceled requests', 'canceled', 'Canceled requests will appear here.')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: GlobalStyles.colors.primary50,
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
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
    marginBottom: 4,
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
  },
  note: {
    marginTop: 6,
    fontSize: 12,
    color: GlobalStyles.colors.gray600,
    fontStyle: 'italic',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEditText: {
    color: GlobalStyles.colors.primary500,
    fontWeight: '700',
  },
  actionCancelText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  actionMessageText: {
    color: GlobalStyles.colors.primary500,
    fontWeight: '700',
  },
});
