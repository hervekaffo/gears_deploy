import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { GlobalStyles, Typography } from '../constants/styles';

export default function SearchFilterScreen({ navigation, route }) {
  const { location } = route.params || {};

  // default today / tomorrow
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const [which, setWhich] = useState('start'); // 'start' | 'end'
  const [show, setShow] = useState(false);

  const [age, setAge] = useState('25');
  const [ageModal, setAgeModal] = useState(false);

  function openPicker(field) {
    setWhich(field);
    setShow(true);
  }
  function handleConfirm(date) {
    setShow(false);
    if (which === 'start') setStartDate(date);
    else setEndDate(date);
  }
  function formatDate(d) {
    // Show as yyyy-mm-dd for consistency with your screenshots
    return d.toLocaleDateString('en-CA');
  }
  function onSearch() {
    navigation.navigate('Browse', {
      location,
      dates: { start: startDate, end: endDate },
      age,
    });
  }

  function openAgePicker() {
    setAgeModal(true);
  }
  function closeAgePicker() {
    setAgeModal(false);
  }
  function onSelectAge(val) {
    setAge(val);
    setAgeModal(false);
  }

  return (
    <View style={styles.screen}>
      {/* Where */}
      <Text style={styles.heading}>Where</Text>
      <Text style={styles.subheading}>
        {typeof location === 'string'
          ? location
          : location && location.latitude
          ? 'Current location'
          : 'Anywhere'}
      </Text>

      {/* Dates */}
      <Text style={[styles.heading, { marginTop: 16 }]}>Dates</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => openPicker('start')}
        >
          <Text style={styles.dateTxt}>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.toTxt}>to</Text>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => openPicker('end')}
        >
          <Text style={styles.dateTxt}>{formatDate(endDate)}</Text>
        </TouchableOpacity>
      </View>
      <DateTimePickerModal
        isVisible={show}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setShow(false)}
      />

      {/* Driver Age */}
      <Text style={[styles.heading, { marginTop: 16 }]}>Driver Age</Text>
      <TouchableOpacity
        style={styles.ageInput}
        onPress={openAgePicker}
        activeOpacity={0.7}
      >
        <Text style={styles.ageInputText}>{age}</Text>
      </TouchableOpacity>
      {/* Age Picker Modal */}
      <Modal
        visible={ageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAgePicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Picker
              selectedValue={age}
              onValueChange={val => setAge(val)}
              style={styles.modalPicker}
            >
              {Array.from({ length: 60 }, (_, i) => i + 18).map(n => (
                <Picker.Item key={n} label={`${n}`} value={`${n}`} />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={closeAgePicker}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search button */}
      <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
        <Text style={styles.searchTxt}>Search</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  heading: {
    ...Typography.h3,
    color: GlobalStyles.colors.gray700,
    marginTop: 16,
  },
  subheading: {
    marginTop: 4,
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
    alignItems: 'center',
  },
  dateTxt: {
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
  },
  toTxt: {
    marginHorizontal: 12,
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
  },

  // Minimal compact age input
  ageInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: GlobalStyles.colors.gray500,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 0,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  ageInputText: {
    fontSize: 18,
    color: GlobalStyles.colors.gray700,
  },

  // Modal styles for the picker
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  modalPicker: {
    width: '100%',
    height: 200,
  },
  modalDoneBtn: {
    marginTop: 8,
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  modalDoneText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  searchBtn: {
    marginTop: 32,
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
