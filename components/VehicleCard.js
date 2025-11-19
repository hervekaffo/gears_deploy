import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';
import { FavoritesContext } from '../store/favorites-context';

export default function VehicleCard({ vehicle, onPress }) {
  const { isFavorite, addFavorite, removeFavorite } = useContext(FavoritesContext);
  const favorite = isFavorite(vehicle.id);
  const title = vehicle.title || `${vehicle.brand || vehicle.make || ''} ${vehicle.model || ''}`.trim();
  const price = vehicle.dailyRate ?? vehicle.price;
  const heroImage = vehicle.image || (vehicle.imageUrl ? { uri: vehicle.imageUrl } : null);
  const trips = vehicle.trips ?? 0;
  const rating = vehicle.rating ?? 0;
  const hostType = vehicle.hostType || 'New Listing';
  const vehicleType = vehicle.vehicleType || 'Recreational Vehicle';
  const powerLabel = vehicle.powerType || (vehicle.electric ? 'Electric' : null);
  const capacityLabel = vehicle.capacity ?? vehicle.seats;
  const scheduleLabel =
    vehicle.availability?.start && vehicle.availability?.end
      ? `${vehicle.availability.start} → ${vehicle.availability.end}`
      : vehicle.dates || 'Flexible availability';
  const locationLabel =
    vehicle.location?.address
      ? vehicle.location.address
      : vehicle.city
        ? `Based in ${vehicle.city}`
        : 'Location shared after booking';
  const fulfillmentPreview = (vehicle.fulfillmentOptions || vehicle.pickupOptions || []).slice(0, 2);
  const featurePreview = (vehicle.features || []).slice(0, 2);

  function toggleFav() {
    if (favorite) removeFavorite(vehicle.id);
    else addFavorite(vehicle);
  }
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {heroImage ? (
        <Image source={heroImage} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={32} color="#fff" />
        </View>
      )}
      <TouchableOpacity style={styles.favIcon} onPress={toggleFav}>
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={24}
          color={favorite ? GlobalStyles.colors.error500 : '#fff'}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.model}>{title || 'Untitled listing'}</Text>

        <View style={styles.tagRow}>
          <View style={[styles.tag, styles.typeTag]}>
            <Text style={styles.tagText}>{vehicleType}</Text>
          </View>
          {powerLabel ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{powerLabel}</Text>
            </View>
          ) : null}
          {capacityLabel ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{`${capacityLabel}+ seats`}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.row}>
          <Text style={styles.rating}>
            {rating.toFixed(1)} ★ ({trips} trips)
          </Text>
          <Text style={styles.host}>{hostType}</Text>
        </View>

        <Text style={styles.distance}>{locationLabel}</Text>
        <Text style={styles.dates}>{scheduleLabel}</Text>

        {(fulfillmentPreview.length > 0 || featurePreview.length > 0) && (
          <View style={styles.chipRow}>
            {fulfillmentPreview.map(option => (
              <View key={option} style={[styles.miniChip, styles.fulfillmentChip]}>
                <Ionicons name="navigate" size={12} color={GlobalStyles.colors.primary500} style={{ marginRight: 4 }} />
                <Text style={styles.miniChipText}>{option}</Text>
              </View>
            ))}
            {featurePreview.map(feature => (
              <View key={feature} style={styles.miniChip}>
                <Text style={styles.miniChipText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {vehicle.discount != null && (
          <Text style={styles.discount}>Save ${vehicle.discount}</Text>
        )}

        <View style={styles.row}>
          {vehicle.oldPrice ? (
            <Text style={styles.oldPrice}>${vehicle.oldPrice}</Text>
          ) : null}
          <Text style={styles.price}> ${price} / day</Text>
        </View>
        <Text style={styles.before}>Before taxes</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3
  },
  image: {
    width: '100%',
    height: 180
  },
  imagePlaceholder:{
    width:'100%',
    height:180,
    backgroundColor:'#1f1f22',
    justifyContent:'center',
    alignItems:'center'
  },
  favIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 4
  },
  info: {
    padding: 12
  },
  tagRow: {
    flexDirection:'row',
    flexWrap:'wrap',
    marginTop:4
  },
  tag: {
    paddingHorizontal:8,
    paddingVertical:2,
    borderRadius:10,
    backgroundColor:'#eef0f3',
    marginRight:6,
    marginBottom:6
  },
  typeTag: {
    backgroundColor: GlobalStyles.colors.primary500 + '22'
  },
  tagText: {
    fontSize:11,
    fontWeight:'600',
    color:GlobalStyles.colors.gray700
  },
  model: {
    fontSize: 16,
    fontWeight: '700',
    color: GlobalStyles.colors.gray700
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  rating: {
    fontSize: 12,
    color: GlobalStyles.colors.gray700
  },
  host: {
    marginLeft: 8,
    fontSize: 12,
    color: GlobalStyles.colors.accent500
  },
  distance: {
    marginTop: 4,
    fontSize: 12,
    color: GlobalStyles.colors.gray500
  },
  dates: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    marginTop: 2
  },
  chipRow: {
    flexDirection:'row',
    flexWrap:'wrap',
    marginTop:8
  },
  miniChip: {
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:10,
    paddingVertical:4,
    borderRadius:12,
    backgroundColor:'#f0f2f6',
    marginRight:6,
    marginBottom:6
  },
  fulfillmentChip: {
    backgroundColor:GlobalStyles.colors.primary500 + '18'
  },
  miniChipText: {
    fontSize:11,
    color:GlobalStyles.colors.gray700,
    fontWeight:'600'
  },
  discount: {
    marginTop: 4,
    color: GlobalStyles.colors.accent500,
    fontWeight: '600'
  },
  oldPrice: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    textDecorationLine: 'line-through'
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
    color: GlobalStyles.colors.gray700
  },
  before: {
    fontSize: 10,
    color: GlobalStyles.colors.gray500,
    marginTop: 2
  }
});
