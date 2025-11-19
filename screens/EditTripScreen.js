import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { BookingsContext } from '../store/bookings-context';
import { GlobalStyles } from '../constants/styles';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

const DAY_MS = 1000 * 60 * 60 * 24;

export default function EditTripScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params ?? {};

  const { myBookings, editBooking } = useContext(BookingsContext);

  const booking = useMemo(
    () => myBookings.find(b => b.id === bookingId),
    [myBookings, bookingId]
  );

  const [startDate, setStartDate] = useState(() =>
    booking ? new Date(booking.start) : new Date()
  );
  const [endDate, setEndDate] = useState(() =>
    booking ? new Date(booking.end) : new Date(Date.now() + DAY_MS)
  );
  const [guests, setGuests] = useState(() =>
    booking?.guests ? String(booking.guests) : '1'
  );
  const [note, setNote] = useState(() => booking?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState('start');

  if (!booking) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingText}>Booking not found.</Text>
      </View>
    );
  }

  function openPicker(field) {
    setPickerField(field);
    setPickerVisible(true);
  }

  function handlePickerConfirm(date) {
    if (!date) {
      setPickerVisible(false);
      return;
    }
    if (pickerField === 'start') {
      setStartDate(date);
      if (date >= endDate) {
        const next = new Date(date.getTime() + DAY_MS);
        setEndDate(next);
      }
    } else {
      if (date <= startDate) {
        setError('End date must be after start date.');
      } else {
        setError('');
        setEndDate(date);
      }
    }
    setPickerVisible(false);
  }

  function handlePickerCancel() {
    setPickerVisible(false);
  }

  async function handleSave() {
    if (endDate <= startDate) {
      setError('End date must be after start date.');
      return;
    }
    const guestsNumber = Number(guests);
    if (!guestsNumber || guestsNumber < 1) {
      setError('Guests must be at least 1.');
      return;
    }

    const nights = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS)
    );

    const nightly =
      typeof booking.nightlyRate === 'number' && booking.nightlyRate > 0
        ? booking.nightlyRate
        : (booking.quotedTotal || 0) / (booking.nights || nights || 1);

    const total = nightly * nights;

    setSaving(true);
    setError('');
    try {
      await editBooking({
        id: booking.id,
        vehicleId: booking.vehicleId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        nightlyRate: nightly,
        nights,
        quotedTotal: total,
        guests: guestsNumber,
        note,
      });
      setSaving(false);
      Alert.alert('Trip updated', 'Your booking request has been updated.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      setSaving(false);
      setError(err?.message || 'Unable to update trip. Please try again.');
    }
  }

  return (
    <>
      <KeyboardAvoidingWrapper style={styles.container} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip dates</Text>
          <TouchableOpacity style={styles.row} onPress={() => openPicker('start')}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={GlobalStyles.colors.primary500}
              style={styles.rowIcon}
            />
            <Text style={styles.rowText}>
              Start: {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openPicker('end')}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={GlobalStyles.colors.primary500}
              style={styles.rowIcon}
            />
            <Text style={styles.rowText}>
              End: {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guests</Text>
          <TextInput
            style={styles.input}
            value={guests}
            onChangeText={setGuests}
            keyboardType="number-pad"
            placeholder="Number of guests"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message to host</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Share your plans or questions (optional)"
            multiline
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>
  </KeyboardAvoidingWrapper>

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="date"
        date={pickerField === 'start' ? startDate : endDate}
        onConfirm={handlePickerConfirm}
        onCancel={handlePickerCancel}
        minimumDate={
          pickerField === 'end'
            ? new Date(startDate.getTime() + DAY_MS)
            : new Date()
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray500,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 16,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
