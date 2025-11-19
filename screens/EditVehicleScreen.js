import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Share,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';

import RequireAuth from '../components/RequireAuth';
import { VehicleContext } from '../store/vehicle-context';
import uploadToCloudinary from '../util/uploadToCloudinary';
import { GlobalStyles, Typography } from '../constants/styles';

const POWER_TYPES = ['Gas', 'Diesel', 'Electric', 'Human-powered'];
const FEATURE_TAGS = [
  'Pet Friendly',
  'Life Jackets',
  'Tow Hitch',
  'Premium Sound',
  'Guided Tour',
  'Sleeps 4+',
  'GPS Included',
];
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

function formatIcsDate(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  content: {
    paddingBottom: 80,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: 12,
    color: GlobalStyles.colors.gray900,
  },
  input: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginBottom: 8,
  },
  subHeading: {
    marginTop: 18,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderColor: GlobalStyles.colors.primary500,
  },
  pillText: {
    color: GlobalStyles.colors.gray600,
    fontSize: 14,
  },
  pillTextActive: {
    color: GlobalStyles.colors.primary700,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
  },
  featuresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    marginRight: 8,
    marginBottom: 8,
  },
  featurePillActive: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderColor: GlobalStyles.colors.primary500,
  },
  featureText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
  },
  featureTextActive: {
    color: GlobalStyles.colors.primary700,
    fontWeight: '600',
  },
  photoThumb: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: GlobalStyles.colors.gray200,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addMediaCard: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    marginTop: 6,
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  videoLabel: {
    flex: 1,
    color: GlobalStyles.colors.gray700,
    fontSize: 14,
  },
  videoAction: {
    color: GlobalStyles.colors.primary600,
    fontWeight: '600',
    marginRight: 12,
  },
  inlineInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonDraftRow: {
    marginTop: 12,
  },
  seasonInput: {
    marginBottom: 12,
  },
  seasonList: {
    marginTop: 8,
    marginBottom: 12,
  },
  seasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  seasonItemLabel: {
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
    fontSize: 15,
  },
  seasonItemDates: {
    color: GlobalStyles.colors.gray600,
    fontSize: 13,
  },
  emptyState: {
    color: GlobalStyles.colors.gray500,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: GlobalStyles.colors.gray800,
    fontWeight: '600',
  },
  fullWidthButton: {
    alignItems: 'center',
  },
  disabledText: {
    color: GlobalStyles.colors.gray400,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  availabilityDates: {
    color: GlobalStyles.colors.gray700,
    fontSize: 14,
  },
  actions: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
  deleteText: {
    color: '#ef4444',
  },
});

function formatIcsStamp(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function mapExistingPhotos(vehicle) {
  const remotePhotos = Array.isArray(vehicle.media?.photos) ? vehicle.media.photos : [];
  if (remotePhotos.length) {
    return remotePhotos.map((photo, idx) => ({
      id: photo.publicId || `${idx}-${photo.url}`,
      uri: photo.url,
      remote: true,
      meta: {
        url: photo.url,
        publicId: photo.publicId || null,
        width: photo.width || null,
        height: photo.height || null,
        bytes: photo.bytes || null,
        format: photo.format || null,
        order: photo.order ?? idx,
      },
    }));
  }
  if (vehicle.imageUrl) {
    return [
      {
        id: `legacy-${vehicle.id}`,
        uri: vehicle.imageUrl,
        remote: true,
        meta: {
          url: vehicle.imageUrl,
          publicId: null,
          width: null,
          height: null,
          bytes: null,
          format: null,
          order: 0,
        },
      },
    ];
  }
  return [];
}

function mapExistingVideo(vehicle) {
  if (vehicle.media?.video) {
    return {
      uri: vehicle.media.video.url,
      remote: true,
      meta: vehicle.media.video,
    };
  }
  return null;
}

function mapBlockedRanges(vehicle) {
  if (!Array.isArray(vehicle.availabilityOverrides)) return [];
  return vehicle.availabilityOverrides
    .filter(override => override && (override.type === 'blocked' || !override.type))
    .map((override, idx) => ({
      id: override.id || `block-${idx}`,
      start: new Date(override.start),
      end: new Date(override.end),
    }))
    .filter(range => !Number.isNaN(range.start) && !Number.isNaN(range.end));
}

export default function EditVehicleScreen({ route, navigation }) {
  const vehicle = route.params?.vehicle || route.params?.car;
  const { updateVehicle, deleteVehicle } = useContext(VehicleContext);

  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  const [title, setTitle] = useState(vehicle.title || '');
  const [vehicleType, setVehicleType] = useState(vehicle.vehicleType || '');
  const [brand, setBrand] = useState(vehicle.brand || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [year, setYear] = useState(vehicle.year ? String(vehicle.year) : currentYear);
  const [powerType, setPowerType] = useState(
    vehicle.powerType || (vehicle.electric ? 'Electric' : POWER_TYPES[0])
  );
  const [capacity, setCapacity] = useState(
    vehicle.capacity != null
      ? String(vehicle.capacity)
      : vehicle.seats != null
      ? String(vehicle.seats)
      : ''
  );
  const [description, setDescription] = useState(vehicle.description || '');

  const [pickupOptions, setPickupOptions] = useState(() => {
    const options = Array.isArray(vehicle.fulfillmentOptions) ? vehicle.fulfillmentOptions : [];
    const normalize = options.map(opt => String(opt || '').toLowerCase());
    return {
      pickup: normalize.includes('pick-up') || normalize.includes('pickup'),
      delivery: normalize.includes('delivery'),
      trailer: normalize.some(opt => opt.includes('trailer')),
    };
  });

  const [features, setFeatures] = useState(Array.isArray(vehicle.features) ? vehicle.features : []);

  const onboarding = vehicle.onboarding || {};
  const [vin, setVin] = useState(onboarding.vin || '');
  const [vinVerified, setVinVerified] = useState(Boolean(onboarding.vinVerified));
  const [insuranceProof, setInsuranceProof] = useState(Boolean(onboarding.insuranceProof));
  const [registrationProof, setRegistrationProof] = useState(Boolean(onboarding.registrationProof));
  const [safetyEquipment, setSafetyEquipment] = useState(Boolean(onboarding.safetyEquipment));
  const [onboardingNotes, setOnboardingNotes] = useState(onboarding.onboardingNotes || '');

  const [photos, setPhotos] = useState(() => mapExistingPhotos(vehicle));
  const [videoClip, setVideoClip] = useState(() => mapExistingVideo(vehicle));

  const pricing = vehicle.pricing || {};
  const [baseRate, setBaseRate] = useState(
    pricing.baseDailyRate != null
      ? String(pricing.baseDailyRate)
      : vehicle.dailyRate != null
      ? String(vehicle.dailyRate)
      : ''
  );
  const [weekendRate, setWeekendRate] = useState(
    pricing.weekendRate != null ? String(pricing.weekendRate) : ''
  );
  const [longTripThreshold, setLongTripThreshold] = useState(
    pricing.longTrip?.thresholdNights != null ? String(pricing.longTrip.thresholdNights) : ''
  );
  const [longTripDiscount, setLongTripDiscount] = useState(
    pricing.longTrip?.discountPercent != null ? String(pricing.longTrip.discountPercent) : ''
  );
  const [seasonalAdjustments, setSeasonalAdjustments] = useState(
    Array.isArray(pricing.seasonalAdjustments)
      ? pricing.seasonalAdjustments.map((adj, idx) => ({
          id: adj.id || `season-${idx}`,
          label: adj.label,
          start: adj.start,
          end: adj.end,
          rate: adj.nightlyRate ?? adj.rate ?? 0,
        }))
      : []
  );
  const [seasonDraft, setSeasonDraft] = useState({
    label: '',
    start: '',
    end: '',
    rate: '',
  });

  const [blockedRanges, setBlockedRanges] = useState(() => mapBlockedRanges(vehicle));
  const [pendingRange, setPendingRange] = useState(null);
  const [availabilityStage, setAvailabilityStage] = useState(null);
  const [availabilityPickerVisible, setAvailabilityPickerVisible] = useState(false);

  const [securityDeposit, setSecurityDeposit] = useState(
    vehicle.securityDeposit != null ? String(vehicle.securityDeposit) : ''
  );

  const [city, setCity] = useState(vehicle.city || '');
  const [locationQuery, setLocationQuery] = useState(vehicle.location?.address || '');
  const [location, setLocation] = useState(
    vehicle.location
      ? {
          lat: vehicle.location.latitude,
          lng: vehicle.location.longitude,
          address: vehicle.location.address,
        }
      : null
  );

  const [saving, setSaving] = useState(false);

  function togglePickup(key) {
    setPickupOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleFeature(tag) {
    setFeatures(prev =>
      prev.includes(tag) ? prev.filter(feature => feature !== tag) : [...prev, tag]
    );
  }

  async function ensureLibraryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return false;
    }
    return true;
  }

  async function addPhoto() {
    if (!(await ensureLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? result.uri;
      setPhotos(prev => [...prev, { id: `${Date.now()}`, uri, remote: false }]);
    }
  }

  function movePhoto(id, direction) {
    setPhotos(prev => {
      const index = prev.findIndex(photo => photo.id === id);
      if (index < 0) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.splice(newIndex, 0, item);
      return updated;
    });
  }

  function removePhoto(id) {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  }

  async function addVideo() {
    if (!(await ensureLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? result.uri;
      setVideoClip({ uri, remote: false });
    }
  }

  async function useCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Please enable location permissions.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync();
      const [rev] = await Location.reverseGeocodeAsync(coords);
      const address = [
        rev.name,
        rev.street,
        rev.city,
        rev.region,
        rev.postalCode,
        rev.country,
      ]
        .filter(Boolean)
        .join(', ');
      setLocation({
        lat: coords.latitude,
        lng: coords.longitude,
        address,
      });
      setCity(rev.city || rev.region || city);
      setLocationQuery(address);
    } catch (err) {
      Alert.alert('Location error', err?.message || 'Could not fetch location.');
    }
  }

  async function geocodeTypedAddress() {
    if (!locationQuery.trim()) {
      Alert.alert('Address needed', 'Enter an address to geocode.');
      return;
    }
    try {
      const [geo] = await Location.geocodeAsync(locationQuery.trim());
      if (!geo) throw new Error();
      setLocation({
        lat: geo.latitude,
        lng: geo.longitude,
        address: locationQuery.trim(),
      });
      const parts = locationQuery.split(',');
      setCity(parts[1]?.trim() || parts[0].trim());
      Alert.alert('Location updated', 'Map has been updated with your address.');
    } catch (err) {
      Alert.alert('Could not geocode', 'Please make sure the address is valid.');
    }
  }

  function beginAddBlockedRange() {
    setPendingRange({
      start: new Date(),
      end: new Date(Date.now() + DAY_MS),
    });
    setAvailabilityStage('start');
    setAvailabilityPickerVisible(true);
  }

  function onAvailabilityConfirm(date) {
    if (!pendingRange) {
      setAvailabilityPickerVisible(false);
      setAvailabilityStage(null);
      return;
    }
    if (availabilityStage === 'start') {
      const adjustedEnd =
        date >= pendingRange.end ? new Date(date.getTime() + DAY_MS) : pendingRange.end;
      setPendingRange({
        start: date,
        end: adjustedEnd,
      });
      setAvailabilityStage('end');
      setTimeout(() => setAvailabilityPickerVisible(true), 0);
    } else {
      if (date <= pendingRange.start) {
        Alert.alert('Invalid range', 'End date must be after start date.');
        setAvailabilityPickerVisible(true);
        return;
      }
      setBlockedRanges(prev => [
        ...prev,
        { id: `${Date.now()}`, start: pendingRange.start, end: date },
      ]);
      setPendingRange(null);
      setAvailabilityStage(null);
      setAvailabilityPickerVisible(false);
    }
  }

  function onAvailabilityCancel() {
    setPendingRange(null);
    setAvailabilityStage(null);
    setAvailabilityPickerVisible(false);
  }

  function removeBlockedRange(id) {
    setBlockedRanges(prev => prev.filter(range => range.id !== id));
  }

  async function shareAvailabilityCalendar() {
    if (!blockedRanges.length) {
      Alert.alert('No blocked dates', 'Add blocked dates before exporting.');
      return;
    }
    const dtStamp = formatIcsStamp(new Date());
    const events = blockedRanges
      .map(range => {
        const start = formatIcsDate(range.start);
        const endExclusive = new Date(range.end.getTime() + DAY_MS);
        const end = formatIcsDate(endExclusive);
        return [
          'BEGIN:VEVENT',
          `UID:block-${range.id}@gears`,
          `DTSTAMP:${dtStamp}`,
          `DTSTART;VALUE=DATE:${start}`,
          `DTEND;VALUE=DATE:${end}`,
          'SUMMARY:Unavailable for rental',
          'END:VEVENT',
        ].join('\n');
      })
      .join('\n');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gears Rentals//EN',
      events,
      'END:VCALENDAR',
    ].join('\n');

    try {
      await Share.share({
        title: `${title || 'vehicle'}-availability.ics`,
        message: ics,
      });
    } catch (err) {
      Alert.alert('Share failed', err?.message || 'Could not share calendar.');
    }
  }

  function addSeasonalAdjustment() {
    const { label, start, end, rate } = seasonDraft;
    if (!label.trim() || !start.trim() || !end.trim() || !rate.trim()) {
      Alert.alert('Incomplete adjustment', 'Fill label, dates, and nightly rate.');
      return;
    }
    const parsedRate = parseFloat(rate);
    if (Number.isNaN(parsedRate)) {
      Alert.alert('Invalid rate', 'Nightly rate must be a number.');
      return;
    }
    setSeasonalAdjustments(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        label: label.trim(),
        start: start.trim(),
        end: end.trim(),
        rate: parsedRate,
      },
    ]);
    setSeasonDraft({ label: '', start: '', end: '', rate: '' });
  }

  function removeSeasonalAdjustment(id) {
    setSeasonalAdjustments(prev => prev.filter(adj => adj.id !== id));
  }

  async function handleSave() {
    if (!title.trim() || !vehicleType.trim() || !brand.trim()) {
      Alert.alert('Missing basics', 'Provide a title, type, and brand.');
      return;
    }
    const baseRateValue = parseFloat(baseRate);
    if (Number.isNaN(baseRateValue)) {
      Alert.alert('Pricing needed', 'Enter a numeric base nightly rate.');
      return;
    }
    if (!location) {
      Alert.alert('Location missing', 'Choose a pickup location for renters.');
      return;
    }
    if (!photos.length) {
      Alert.alert('Photos needed', 'Keep at least one photo to showcase your vehicle.');
      return;
    }

    setSaving(true);
    try {
      const photoPayload = [];
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (photo.remote && photo.meta) {
          photoPayload.push({ ...photo.meta, order: index });
        } else {
          const res = await uploadToCloudinary(photo.uri, {
            folder: 'gears/vehicles/photos',
            tags: ['vehicle', vehicleType || 'recreation'],
            context: { title },
          });
          photoPayload.push({
            url: res.secure_url,
            publicId: res.public_id,
            width: res.width,
            height: res.height,
            bytes: res.bytes,
            format: res.format,
            order: index,
          });
        }
      }

      let videoPayload = null;
      if (videoClip) {
        if (videoClip.remote && videoClip.meta) {
          videoPayload = videoClip.meta;
        } else if (videoClip.uri) {
          const res = await uploadToCloudinary(videoClip.uri, {
            folder: 'gears/vehicles/videos',
            tags: ['vehicle', 'walkthrough', vehicleType || 'recreation'],
            resourceType: 'video',
          });
          videoPayload = {
            url: res.secure_url,
            publicId: res.public_id,
            bytes: res.bytes,
            format: res.format,
            duration: res.duration,
          };
        }
      }

      const weekendRateValue = parseFloat(weekendRate);
      const longTripThresholdValue = parseInt(longTripThreshold, 10);
      const longTripDiscountValue = parseFloat(longTripDiscount);
      const securityDepositValue = parseFloat(securityDeposit);

      const vehicleData = {
        title: title.trim(),
        vehicleType: vehicleType.trim(),
        brand: brand.trim(),
        model: model.trim() || null,
        year: year.trim() ? parseInt(year, 10) : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        seats: capacity ? parseInt(capacity, 10) : null,
        powerType,
        description: description.trim() || null,
        city: city.trim(),
        dailyRate: baseRateValue,
        securityDeposit: Number.isNaN(securityDepositValue) ? null : securityDepositValue,
        imageUrl: photoPayload[0]?.url || null,
        fulfillmentOptions: [
          pickupOptions.pickup && 'Pick-up',
          pickupOptions.delivery && 'Delivery',
          pickupOptions.trailer && 'Trailer Included',
        ].filter(Boolean),
        features,
        media: {
          photos: photoPayload,
          video: videoPayload,
        },
        onboarding: {
          vin: vin.trim(),
          vinVerified,
          insuranceProof,
          registrationProof,
          safetyEquipment,
          onboardingNotes: onboardingNotes.trim() || null,
        },
        pricing: {
          baseDailyRate: baseRateValue,
          weekendRate: Number.isNaN(weekendRateValue) ? null : weekendRateValue,
          longTrip: {
            thresholdNights: Number.isNaN(longTripThresholdValue) ? null : longTripThresholdValue,
            discountPercent: Number.isNaN(longTripDiscountValue) ? null : longTripDiscountValue,
          },
          seasonalAdjustments: seasonalAdjustments.map(adj => ({
            label: adj.label,
            start: adj.start,
            end: adj.end,
            nightlyRate: adj.rate,
          })),
        },
        availabilityOverrides: blockedRanges.map(range => ({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
          type: 'blocked',
        })),
        location: location
          ? {
              latitude: location.lat,
              longitude: location.lng,
              address: location.address,
            }
          : null,
      };

      await updateVehicle(vehicle.id, vehicleData);
      setSaving(false);
      Alert.alert('Listing updated', 'Changes saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setSaving(false);
      Alert.alert('Could not save', err?.message || 'Please try again.');
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete listing?',
      'This will remove the vehicle and any future bookings must be handled manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              Alert.alert('Listing deleted');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Delete failed', err?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  }

  function renderBasicSection() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle basics</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Listing title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Vehicle type (e.g., Camper Van)"
          value={vehicleType}
          onChangeText={setVehicleType}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Brand / Make"
          value={brand}
          onChangeText={setBrand}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Model"
          value={model}
          onChangeText={setModel}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Year"
          keyboardType="number-pad"
          value={year}
          onChangeText={setYear}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Seats / capacity"
          keyboardType="number-pad"
          value={capacity}
          onChangeText={setCapacity}
        />

        <Text style={styles.label}>Power type</Text>
        <View style={styles.pillRow}>
          {POWER_TYPES.map(type => {
            const active = powerType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setPowerType(type)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="What makes this vehicle special?"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>
    );
  }

  function renderAmenitiesSection() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup & amenities</Text>
        {[
          { key: 'pickup', label: 'Pick-up' },
          { key: 'delivery', label: 'Delivery available' },
          { key: 'trailer', label: 'Trailer included' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.checkboxRow}
            onPress={() => togglePickup(option.key)}
          >
            <Ionicons
              name={pickupOptions[option.key] ? 'checkbox' : 'square-outline'}
              size={22}
              color={
                pickupOptions[option.key]
                  ? GlobalStyles.colors.primary500
                  : GlobalStyles.colors.gray500
              }
            />
            <Text style={styles.checkboxLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.label, { marginTop: 16 }]}>Popular features</Text>
        <View style={styles.featuresWrap}>
          {FEATURE_TAGS.map(tag => {
            const active = features.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleFeature(tag)}
                style={[styles.featurePill, active && styles.featurePillActive]}
              >
                <Text style={[styles.featureText, active && styles.featureTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function renderOnboardingSection() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Onboarding checklist</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="VIN (optional but recommended)"
          value={vin}
          onChangeText={setVin}
        />
        {[
          { value: vinVerified, setter: setVinVerified, label: 'VIN verified' },
          { value: insuranceProof, setter: setInsuranceProof, label: 'Insurance proof uploaded' },
          { value: registrationProof, setter: setRegistrationProof, label: 'Registration proof uploaded' },
          { value: safetyEquipment, setter: setSafetyEquipment, label: 'Safety equipment onboard' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.checkboxRow}
            onPress={() => item.setter(prev => !prev)}
          >
            <Ionicons
              name={item.value ? 'checkbox' : 'square-outline'}
              size={22}
              color={item.value ? GlobalStyles.colors.primary500 : GlobalStyles.colors.gray500}
            />
            <Text style={styles.checkboxLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Notes for verification team (optional)"
          value={onboardingNotes}
          onChangeText={setOnboardingNotes}
          multiline
        />
      </View>
    );
  }

  function renderMediaSection() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos & walkthrough</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoThumb}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <View style={styles.photoActions}>
                <TouchableOpacity onPress={() => movePhoto(photo.id, -1)} disabled={index === 0}>
                  <Ionicons
                    name="arrow-up-circle"
                    size={18}
                    color={index === 0 ? GlobalStyles.colors.gray500 : GlobalStyles.colors.primary500}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => movePhoto(photo.id, 1)}
                  disabled={index === photos.length - 1}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={18}
                    color={
                      index === photos.length - 1
                        ? GlobalStyles.colors.gray500
                        : GlobalStyles.colors.primary500
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removePhoto(photo.id)}>
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addMediaCard} onPress={addPhoto}>
            <Ionicons name="add-circle-outline" size={30} color={GlobalStyles.colors.primary500} />
            <Text style={styles.addMediaText}>Add photo</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.videoRow}>
          <Ionicons
            name={videoClip ? 'film' : 'film-outline'}
            size={20}
            color={GlobalStyles.colors.primary500}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.videoLabel}>
            {videoClip ? 'Walkthrough video attached' : 'Add optional walkthrough video'}
          </Text>
          <TouchableOpacity onPress={addVideo}>
            <Text style={styles.videoAction}>Choose video</Text>
          </TouchableOpacity>
          {videoClip ? (
            <TouchableOpacity onPress={() => setVideoClip(null)}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  function renderPricingSection() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Base nightly rate"
          value={baseRate}
          onChangeText={setBaseRate}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Weekend nightly rate (optional)"
          value={weekendRate}
          onChangeText={setWeekendRate}
          keyboardType="decimal-pad"
        />
        <View style={styles.inlineInputs}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 6 }]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="Long trip threshold (nights)"
            value={longTripThreshold}
            onChangeText={setLongTripThreshold}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 6 }]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="Long trip discount (%)"
            value={longTripDiscount}
            onChangeText={setLongTripDiscount}
            keyboardType="decimal-pad"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Security deposit (optional)"
          value={securityDeposit}
          onChangeText={setSecurityDeposit}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, styles.subHeading]}>Seasonal adjustments</Text>
        {seasonalAdjustments.length ? (
          <View style={styles.seasonList}>
            {seasonalAdjustments.map(adj => (
              <View key={adj.id} style={styles.seasonItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.seasonItemLabel}>{adj.label}</Text>
                  <Text style={styles.seasonItemDates}>
                    {`${adj.start} -> ${adj.end} | $${adj.rate}/night`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSeasonalAdjustment(adj.id)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>No seasonal pricing configured.</Text>
        )}

        <View style={styles.seasonDraftRow}>
          <TextInput
            style={[styles.input, styles.seasonInput]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="Label"
            value={seasonDraft.label}
            onChangeText={label => setSeasonDraft(prev => ({ ...prev, label }))}
          />
          <TextInput
            style={[styles.input, styles.seasonInput]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="Start (YYYY-MM-DD)"
            value={seasonDraft.start}
            onChangeText={start => setSeasonDraft(prev => ({ ...prev, start }))}
          />
          <TextInput
            style={[styles.input, styles.seasonInput]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="End (YYYY-MM-DD)"
            value={seasonDraft.end}
            onChangeText={end => setSeasonDraft(prev => ({ ...prev, end }))}
          />
          <TextInput
            style={[styles.input, styles.seasonInput]}
            placeholderTextColor={GlobalStyles.colors.gray600}
            placeholder="Nightly rate"
            value={seasonDraft.rate}
            onChangeText={rate => setSeasonDraft(prev => ({ ...prev, rate }))}
            keyboardType="decimal-pad"
          />
        </View>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.fullWidthButton]}
          onPress={addSeasonalAdjustment}
        >
          <Text style={styles.secondaryButtonText}>Add seasonal rate</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderAvailabilitySection() {
    const sortedRanges = [...blockedRanges].sort((a, b) => a.start - b.start);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <Text style={styles.label}>Blocked dates</Text>
        {sortedRanges.length ? (
          sortedRanges.map(range => (
            <View key={range.id} style={styles.availabilityRow}>
              <Text style={styles.availabilityDates}>
                {`${range.start.toDateString()} → ${range.end.toDateString()}`}
              </Text>
              <TouchableOpacity onPress={() => removeBlockedRange(range.id)}>
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyState}>No blocked dates yet.</Text>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={beginAddBlockedRange}>
            <Text style={styles.secondaryButtonText}>Block dates</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, !blockedRanges.length && styles.buttonDisabled]}
            onPress={shareAvailabilityCalendar}
            disabled={!blockedRanges.length}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                !blockedRanges.length && styles.disabledText,
              ]}
            >
              Export calendar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderLocationSection() {
    const region = location
      ? {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup location</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={GlobalStyles.colors.gray600}
          placeholder="Full address"
          value={locationQuery}
          onChangeText={setLocationQuery}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={useCurrentLocation}>
            <Text style={styles.secondaryButtonText}>Use my location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={geocodeTypedAddress}>
            <Text style={styles.secondaryButtonText}>Update map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={region || DEFAULT_REGION}
            region={region || undefined}
          >
            {region ? (
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
            ) : null}
          </MapView>
        </View>
      </View>
    );
  }

  function renderActionsSection() {
    return (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.dangerButton, styles.fullWidthButton]}
          onPress={handleDelete}
          disabled={saving}
        >
          <Text style={[styles.secondaryButtonText, styles.deleteText]}>Delete listing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save changes'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <RequireAuth>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingWrapper style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {renderBasicSection()}
          {renderAmenitiesSection()}
          {renderOnboardingSection()}
          {renderMediaSection()}
          {renderPricingSection()}
          {renderAvailabilitySection()}
          {renderLocationSection()}
          {renderActionsSection()}
        </KeyboardAvoidingWrapper>
        <DateTimePickerModal
          isVisible={availabilityPickerVisible}
          mode="date"
          onConfirm={onAvailabilityConfirm}
          onCancel={onAvailabilityCancel}
          minimumDate={availabilityStage === 'end' ? pendingRange?.start : new Date()}
          date={
            availabilityStage === 'end' && pendingRange
              ? pendingRange.end
              : pendingRange?.start || new Date()
          }
        />
      </SafeAreaView>
    </RequireAuth>
  );
}
