import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';
import { FavoritesContext } from '../store/favorites-context';
import { BookingsContext } from '../store/bookings-context';
import { AuthContext } from '../store/auth-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

const screenWidth = Dimensions.get('window').width;

export default function VehicleDetailScreen({ route, navigation }) {
  const vehicle = useMemo(() => {
    const paramVehicle = route.params?.vehicle;
    const legacyCar = route.params?.car;
    return {
      ...(legacyCar || {}),
      ...(paramVehicle || {}),
    };
  }, [route.params]);

  const primaryImage =
    vehicle.image ||
    (vehicle.imageUrl ? { uri: vehicle.imageUrl } : null);

  const photoSources = useMemo(() => {
    const seen = new Set();
    const items = [];

    const pushSource = source => {
      if (!source) return;
      if (typeof source === 'number') {
        if (!seen.has(source)) {
          seen.add(source);
          items.push(source);
        }
        return;
      }
      if (typeof source === 'string') {
        const trimmed = source.trim();
        if (!trimmed) return;
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          items.push({ uri: trimmed });
        }
        return;
      }
      if (typeof source === 'object') {
        if (source.uri) {
          const key = source.uri;
          if (key && !seen.has(key)) {
            seen.add(key);
            items.push(source);
          }
        }
      }
    };

    const mediaPhotos = Array.isArray(vehicle?.media?.photos) ? vehicle.media.photos : [];
    mediaPhotos.forEach(photo => pushSource(photo?.url));

    const legacyPhotos = Array.isArray(vehicle?.photos) ? vehicle.photos : [];
    legacyPhotos.forEach(photo => {
      if (typeof photo === 'string' || typeof photo === 'number') {
        pushSource(photo);
      } else if (photo?.url) {
        pushSource(photo.url);
      }
    });

    const galleryPhotos = Array.isArray(vehicle?.gallery) ? vehicle.gallery : [];
    galleryPhotos.forEach(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        pushSource(item);
      } else if (item?.url) {
        pushSource(item.url);
      }
    });

    if (vehicle?.imageUrl) pushSource(vehicle.imageUrl);
    if (vehicle?.image) pushSource(vehicle.image);
    if (primaryImage) pushSource(primaryImage);

    return items;
  }, [vehicle, primaryImage]);

  const rating = vehicle.rating ?? 0;
  const trips = vehicle.trips ?? 0;
  const title =
    vehicle.title ||
    `${vehicle.brand || vehicle.make || ''} ${vehicle.model || ''}`.trim() ||
    vehicle.vehicleType ||
    'Adventure Vehicle';
  const locationLabel =
    vehicle.location?.address ||
    (vehicle.city ? `Based in ${vehicle.city}` : 'Location shared after booking');
  const availabilityLabel =
    vehicle.availability?.start && vehicle.availability?.end
      ? `${vehicle.availability.start} → ${vehicle.availability.end}`
      : vehicle.dates || 'Flexible availability';
  const fulfillment = vehicle.fulfillmentOptions || vehicle.pickupOptions || [];
  const features = vehicle.features || [];
  const seating = vehicle.capacity ?? vehicle.seats;
  const powerType = vehicle.powerType || (vehicle.electric ? 'Electric' : null);
  const dailyRate = vehicle.dailyRate ?? vehicle.price ?? 0;
  const nightlyRate = dailyRate;
  const oldPrice = vehicle.oldPrice ?? null;
  const securityDeposit = vehicle.securityDeposit ?? null;

  const { isFavorite, addFavorite, removeFavorite } = useContext(FavoritesContext);
  const { user } = useContext(AuthContext);
  const {
    myBookings,
    hostBookings,
    requestBooking,
  } = useContext(BookingsContext);

  const favorite = vehicle?.id ? isFavorite(vehicle.id) : false;
  const isOwner = user?.uid && vehicle?.ownerId === user.uid;

  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => new Date(Date.now() + 24 * 60 * 60 * 1000), []);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [bookingError, setBookingError] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [tripMessage, setTripMessage] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState('start');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    setCurrentPhoto(0);
  }, [vehicle?.id, photoSources.length]);

  const renterHasBooking = useMemo(() => {
    if (!vehicle?.id || !myBookings?.length) return false;
    return myBookings.some(
      b => b.vehicleId === vehicle.id && !['completed', 'canceled'].includes(b.status)
    );
  }, [vehicle?.id, myBookings]);

  const hostUpcoming = useMemo(() => {
    if (!vehicle?.id || !hostBookings?.length) return 0;
    return hostBookings.filter(
      b => b.vehicleId === vehicle.id && ['requested', 'approved', 'active'].includes(b.status)
    ).length;
  }, [vehicle?.id, hostBookings]);

  const tripNights = useMemo(() => {
    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  }, [startDate, endDate]);

  const tripTotal = useMemo(() => nightlyRate * tripNights, [nightlyRate, tripNights]);

  function handlePhotoMomentum(event) {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    if (!layoutMeasurement?.width || !photoSources.length) return;
    const rawIndex = Math.round(contentOffset.x / layoutMeasurement.width);
    if (Number.isNaN(rawIndex)) return;
    const boundedIndex = Math.min(photoSources.length - 1, Math.max(0, rawIndex));
    setCurrentPhoto(boundedIndex);
  }

  function toggleFavorite() {
    if (!vehicle?.id) return;
    if (favorite) removeFavorite(vehicle.id);
    else addFavorite(vehicle);
  }

  function openBookingModal() {
    setBookingError('');
    setBookingModalVisible(true);
    setDatePickerVisible(false);
  }

  function closeBookingModal() {
    setBookingModalVisible(false);
    setDatePickerVisible(false);
  }

  function resetPaymentForm() {
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setPaymentError('');
    setPaymentLoading(false);
  }

  function openPicker(field) {
    setBookingError('');
    setPickerField(field);
    setBookingModalVisible(false);
    const delay = Platform.OS === 'ios' ? 300 : 10;
    setTimeout(() => setDatePickerVisible(true), delay);
  }

  function handlePickerCancel() {
    setDatePickerVisible(false);
    const reopenDelay = Platform.OS === 'ios' ? 350 : 0;
    setTimeout(() => setBookingModalVisible(true), reopenDelay);
  }

  function onConfirmPicker(date) {
    if (!date) {
      handlePickerCancel();
      return;
    }

    if (pickerField === 'start') {
      setStartDate(date);
      if (date >= endDate) {
        const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        setEndDate(nextDay);
      }
    } else {
      if (date <= startDate) {
        setBookingError('End date must be after start date.');
      } else {
        setBookingError('');
        setEndDate(date);
      }
    }
    setDatePickerVisible(false);
    const reopenDelay = Platform.OS === 'ios' ? 350 : 0;
    setTimeout(() => setBookingModalVisible(true), reopenDelay);
  }

  function backToBookingDetails() {
    setShowPaymentModal(false);
    setTimeout(() => setBookingModalVisible(true), Platform.OS === 'ios' ? 200 : 0);
  }

  function handleCardNumberChange(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  }

  function handleExpiryChange(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) {
      setCardExpiry(digits);
    } else {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    }
  }

  function handleCvcChange(value) {
    setCardCvc(value.replace(/\D/g, '').slice(0, 4));
  }

  function proceedToPayment() {
    if (!user?.uid) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    if (endDate <= startDate) {
      setBookingError('End date must be after start date.');
      return;
    }
    setBookingModalVisible(false);
    resetPaymentForm();
    setShowPaymentModal(true);
  }

  async function handlePaymentSubmit() {
    if (!user?.uid) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 12) {
      setPaymentError('Enter a valid card number.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      setPaymentError('Use MM/YY expiry format.');
      return;
    }
    if (cardCvc.length < 3) {
      setPaymentError('CVC must be at least 3 digits.');
      return;
    }

    const normalizedGuests = Number(guestCount) || 1;

    setPaymentLoading(true);
    setPaymentError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const trimmedNote = tripMessage?.trim() || null;
      const derivedTitle =
        vehicle?.title ||
        `${vehicle?.brand || vehicle?.make || ''} ${vehicle?.model || ''}`.trim() ||
        vehicle?.vehicleType ||
        null;
      const vehicleImage =
        vehicle?.imageUrl ||
        vehicle?.image?.uri ||
        (typeof vehicle?.image === 'string' ? vehicle.image : null);
      const hostId =
        typeof vehicle?.ownerId === 'string' && vehicle.ownerId.length
          ? vehicle.ownerId
          : null;

      await requestBooking({
        vehicleId: vehicle?.id ? String(vehicle.id) : '',
        vehicleTitle: derivedTitle,
        vehicleImage,
        hostId,
        renterId: user.uid,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        status: 'requested',
        paymentStatus: 'simulated_paid',
        nightlyRate,
        nights: tripNights,
        quotedTotal: tripTotal,
        simulated: true,
        guests: normalizedGuests,
        note: trimmedNote,
        payment: { status: 'simulated_paid' },
      });

      setPaymentLoading(false);
      setShowPaymentModal(false);
      setTripMessage('');
      setGuestCount('1');
      Alert.alert('Payment approved', 'We simulated your payment and sent the booking request.');
    } catch (err) {
      setPaymentLoading(false);
      setPaymentError(err?.message || 'Could not complete payment.');
    }
  }

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.heroWrapper}>
          {photoSources.length ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handlePhotoMomentum}
                scrollEventThrottle={16}
                style={styles.heroCarousel}
              >
                {photoSources.map((source, index) => {
                  const key =
                    typeof source === 'number'
                      ? `photo-local-${index}`
                      : `photo-remote-${source.uri || index}`;
                  return <Image key={key} source={source} style={styles.heroImage} />;
                })}
              </ScrollView>
              {photoSources.length > 1 ? (
                <View style={styles.heroDots}>
                  {photoSources.map((_, idx) => (
                    <View
                      key={`dot-${idx}`}
                      style={[styles.heroDot, idx === currentPhoto && styles.heroDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={42} color="#fff" />
              <Text style={styles.heroPlaceholderText}>No photo available</Text>
            </View>
          )}

          <View style={styles.header}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {vehicle.vehicleType || 'Recreational vehicle'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.rating}>
              {rating.toFixed(1)} ★ ({trips} trips)
            </Text>
            <Text style={styles.host}>{vehicle.hostType || 'Trusted host'}</Text>
          </View>

          {/* Overview */}
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.sectionRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={GlobalStyles.colors.gray700}
            />
            <Text style={styles.sectionText}>{availabilityLabel}</Text>
          </View>

          <Text style={styles.sectionTitle}>Pickup & delivery</Text>
          <View style={styles.sectionRow}>
            <Ionicons
              name="navigate-outline"
              size={18}
              color={GlobalStyles.colors.gray700}
            />
            <Text style={styles.sectionText}>{locationLabel}</Text>
          </View>
          {fulfillment.length ? (
            <View style={styles.chipRow}>
              {fulfillment.map(option => (
                <View key={option} style={styles.chip}>
                  <Text style={styles.chipText}>{option}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Specs */}
          <Text style={styles.sectionTitle}>Specs & details</Text>
          <View style={styles.specGrid}>
            {vehicle.brand || vehicle.make ? (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Brand</Text>
                <Text style={styles.specValue}>{vehicle.brand || vehicle.make}</Text>
              </View>
            ) : null}
            {vehicle.model ? (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Model</Text>
                <Text style={styles.specValue}>{vehicle.model}</Text>
              </View>
            ) : null}
            {vehicle.year ? (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Year</Text>
                <Text style={styles.specValue}>{vehicle.year}</Text>
              </View>
            ) : null}
            {seating ? (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Capacity</Text>
                <Text style={styles.specValue}>{seating} people</Text>
              </View>
            ) : null}
            {powerType ? (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Power</Text>
                <Text style={styles.specValue}>{powerType}</Text>
              </View>
            ) : null}
          </View>

          {features.length ? (
            <>
              <Text style={styles.sectionTitle}>Included features</Text>
              <View style={styles.chipRow}>
                {features.map(feature => (
                  <View key={feature} style={styles.chip}>
                    <Text style={styles.chipText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {vehicle.description ? (
            <>
              <Text style={styles.sectionTitle}>About this vehicle</Text>
              <Text style={styles.description}>{vehicle.description}</Text>
            </>
          ) : null}

          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              navigation.navigate('VehicleMap', {
                vehicle,
              })
            }
          >
            <Ionicons
              name="map-outline"
              size={20}
              color={GlobalStyles.colors.surface}
            />
            <Text style={styles.mapBtnText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            {oldPrice ? <Text style={styles.oldPrice}>${oldPrice}</Text> : null}
            <Text style={styles.total}>${dailyRate} / day</Text>
          </View>
          {securityDeposit ? (
            <Text style={styles.before}>Security deposit ${securityDeposit}</Text>
          ) : null}
          <Text style={styles.before}>Taxes and fees calculated at checkout</Text>
          {isOwner ? (
            <View style={styles.noticePill}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={GlobalStyles.colors.primary500}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.noticeText}>You’re the host of this vehicle.</Text>
            </View>
          ) : renterHasBooking ? (
            <View style={styles.noticePill}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#f59e0b"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.noticeText}>
                You already have an upcoming booking for this vehicle.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={openBookingModal}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.continueText}>Request to book</Text>
            </TouchableOpacity>
          )}
          {hostUpcoming > 0 && (
            <Text style={styles.noticeHint}>
              {hostUpcoming} upcoming booking
              {hostUpcoming > 1 ? 's' : ''} already scheduled for this vehicle.
            </Text>
          )}
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={pickerField === 'end' ? endDate : startDate}
        onConfirm={onConfirmPicker}
        onCancel={handlePickerCancel}
        minimumDate={
          pickerField === 'end'
            ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
            : today
        }
      />

      {/* Booking modal (keyboard-aware) */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeBookingModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <KeyboardAvoidingWrapper contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.modalTitle}>Request this vehicle</Text>
              <Text style={styles.modalSubtitle}>Choose your trip dates</Text>

              <TouchableOpacity
                style={styles.modalDateRow}
                onPress={() => openPicker('start')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={GlobalStyles.colors.primary500}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalDateText}>
                  Start: {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDateRow}
                onPress={() => openPicker('end')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={GlobalStyles.colors.primary500}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalDateText}>
                  End: {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <Text style={styles.modalSummary}>
                ${dailyRate} / night · {tripNights} night(s)
              </Text>
              <Text style={styles.modalSummaryTotal}>
                Estimated total ${tripTotal.toFixed(2)}
              </Text>

              <Text style={styles.modalLabel}>Guests</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={guestCount}
                onChangeText={setGuestCount}
                placeholder="How many guests?"
              />

              <Text style={styles.modalLabel}>Trip details for the host</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={tripMessage}
                onChangeText={setTripMessage}
                placeholder="Share your plans or questions"
                multiline
                numberOfLines={4}
              />

              {bookingError ? (
                <Text style={styles.modalError}>{bookingError}</Text>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={closeBookingModal}
                >
                  <Text style={styles.modalCancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmit}
                  onPress={proceedToPayment}
                >
                  <Text style={styles.modalSubmitText}>Continue to payment</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingWrapper>
          </View>
        </View>
      </Modal>

      {/* Payment modal (keyboard-aware) */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentBackdrop}>
          <View style={styles.paymentSheet}>
            <KeyboardAvoidingWrapper contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.paymentTitle}>Confirm & pay</Text>
              <Text style={styles.paymentSubtitle}>
                We’ll simulate a card charge before sending your request.
              </Text>

              <View style={styles.paymentSummary}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Trip</Text>
                  <Text style={styles.paymentValue}>
                    {startDate.toLocaleDateString()} →{' '}
                    {endDate.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Guests</Text>
                  <Text style={styles.paymentValue}>{guestCount || '1'}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Rate</Text>
                  <Text style={styles.paymentValue}>
                    ${dailyRate} × {tripNights} nights
                  </Text>
                </View>
                <View style={[styles.paymentRow, styles.paymentRowTotal]}>
                  <Text style={styles.paymentTotalLabel}>Total due</Text>
                  <Text style={styles.paymentTotalValue}>
                    ${tripTotal.toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={styles.paymentFieldLabel}>Card number</Text>
              <TextInput
                style={styles.paymentInput}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="number-pad"
                placeholder="0000 0000 0000 0000"
              />

              <View style={styles.paymentInlineFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.paymentFieldLabel}>Expiry (MM/YY)</Text>
                  <TextInput
                    style={styles.paymentInput}
                    value={cardExpiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="number-pad"
                    placeholder="08/29"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.paymentFieldLabel}>CVC</Text>
                  <TextInput
                    style={styles.paymentInput}
                    value={cardCvc}
                    onChangeText={handleCvcChange}
                    keyboardType="number-pad"
                    placeholder="123"
                    secureTextEntry
                  />
                </View>
              </View>

              {paymentError ? (
                <Text style={styles.paymentError}>{paymentError}</Text>
              ) : null}

              <View style={styles.paymentActions}>
                <TouchableOpacity
                  style={styles.paymentSecondary}
                  onPress={backToBookingDetails}
                  disabled={paymentLoading}
                >
                  <Text style={styles.paymentSecondaryText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.paymentPrimary}
                  onPress={handlePaymentSubmit}
                  disabled={paymentLoading}
                >
                  <Text style={styles.paymentPrimaryText}>
                    {paymentLoading ? 'Processing…' : 'Pay & request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingWrapper>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  heroWrapper: {
    position: 'relative',
    backgroundColor: GlobalStyles.colors.primary50,
    paddingBottom: 24,
  },
  heroCarousel: {
    width: screenWidth,
    height: 250,
  },
  heroImage: {
    width: screenWidth,
    height: 250,
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: screenWidth,
    height: 250,
    backgroundColor: '#1f1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDots: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 4,
  },
  heroDotActive: {
    backgroundColor: '#fff',
  },
  heroPlaceholderText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 8,
    borderRadius: 22,
  },
  content: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  subtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: GlobalStyles.colors.gray700,
  },
  host: {
    marginLeft: 8,
    fontSize: 12,
    color: GlobalStyles.colors.accent500,
  },
  sectionTitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionText: {
    flex: 1,
    marginHorizontal: 8,
    color: GlobalStyles.colors.gray700,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: GlobalStyles.colors.primary500 + '22',
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: GlobalStyles.colors.primary700,
    fontSize: 12,
    fontWeight: '600',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  specItem: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 11,
    color: GlobalStyles.colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  specValue: {
    fontSize: 15,
    color: GlobalStyles.colors.gray700,
    marginTop: 2,
    fontWeight: '600',
  },
  description: {
    marginTop: 8,
    lineHeight: 20,
    color: GlobalStyles.colors.gray700,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  mapBtnText: {
    color: GlobalStyles.colors.surface,
    marginLeft: 8,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: GlobalStyles.colors.primary200,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    textDecorationLine: 'line-through',
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 4,
    color: GlobalStyles.colors.gray700,
  },
  before: {
    fontSize: 10,
    color: GlobalStyles.colors.gray500,
    marginVertical: 4,
  },
  continueBtn: {
    backgroundColor: GlobalStyles.colors.primary500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  continueText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.surface,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  noticeText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 14,
    fontWeight: '600',
  },
  noticeHint: {
    marginTop: 8,
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GlobalStyles.colors.gray800,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    textAlign: 'center',
    color: GlobalStyles.colors.gray600,
    marginBottom: 12,
  },
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalDateText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray700,
    fontWeight: '600',
  },
  modalSummary: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  modalSummaryTotal: {
    textAlign: 'center',
    fontWeight: '700',
    color: GlobalStyles.colors.primary500,
    marginBottom: 8,
  },
  modalLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: GlobalStyles.colors.gray600,
  },
  modalInput: {
    marginTop: 6,
    backgroundColor: '#f4f5f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: GlobalStyles.colors.gray700,
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalError: {
    marginTop: 8,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  modalCancel: {
    marginRight: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: GlobalStyles.colors.gray600,
    fontWeight: '700',
  },
  modalSubmit: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
  },
  paymentBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  paymentSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GlobalStyles.colors.gray800,
    textAlign: 'center',
  },
  paymentSubtitle: {
    textAlign: 'center',
    color: GlobalStyles.colors.gray600,
    marginTop: 6,
    marginBottom: 18,
  },
  paymentSummary: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray200,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentRowTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GlobalStyles.colors.gray300,
  },
  paymentLabel: {
    color: GlobalStyles.colors.gray600,
    fontSize: 14,
  },
  paymentValue: {
    color: GlobalStyles.colors.gray800,
    fontWeight: '600',
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700,
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray800,
  },
  paymentFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: GlobalStyles.colors.gray600,
    marginBottom: 6,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    marginBottom: 12,
  },
  paymentInlineFields: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentError: {
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  paymentSecondaryText: {
    fontWeight: '600',
    color: GlobalStyles.colors.gray600,
  },
  paymentPrimary: {
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  paymentPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
