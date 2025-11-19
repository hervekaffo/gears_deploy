import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import {
  View, Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDistance } from 'geolib';
import { GlobalStyles } from '../constants/styles';
import VehicleCard from '../components/VehicleCard';
import { VehicleContext } from '../store/vehicle-context';

const FILTERS = ['Price & distance','Vehicle type','Brand','Year','Features','Power'];
const VEHICLE_TYPES = ['Boat','Camper Van','Travel Trailer','ATV','Jet Ski','Motorcycle','RV','Snowmobile','Off-road Buggy'];
const MAKES = ['Yamaha','Sea-Doo','Polaris','Can-Am','Winnebago','Airstream','MasterCraft','Kawasaki','Harley-Davidson','Bayliner','Coachmen'];
const YEARS = ['2020','2021','2022','2023','2024', '2025'];
const FEATURE_TAGS = ['Pet Friendly','Life Jackets','Tow Hitch','Premium Sound','Guided Tour','Sleeps 4+','GPS Included'];
const POWER_TYPES = ['Gas','Diesel','Electric','Human-powered'];

export default function HomeScreen({ navigation, route }) {
  const { vehicles: allVehicles } = useContext(VehicleContext);
  const [searchLabel, setSearchLabel]   = useState('Anywhere');
  const [filteredVehicles, setFilteredVehicles] = useState(allVehicles);
  const [keyword, setKeyword] = useState('');

  // filter states
  const [priceFilter, setPriceFilter]           = useState({ min:'', max:'' });
  const [radiusFilter, setRadiusFilter]         = useState(50);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [makeFilter, setMakeFilter]             = useState('');
  const [yearFilter, setYearFilter]             = useState('');
  const [featureFilter, setFeatureFilter]       = useState([]);
  const [powerFilter, setPowerFilter]           = useState([]);

  // which modal is open (null | 'Price' | 'Vehicle type' | 'Make' | 'Year')
  const [modalVisible, setModalVisible] = useState({ type: null });
  const locationParam = route.params?.location;
  const hasLocationFilter = Boolean(locationParam && locationParam !== 'Anywhere' && typeof locationParam !== 'undefined');

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (keyword.trim()) chips.push(`“${keyword.trim()}”`);
    if (vehicleTypeFilter) chips.push(vehicleTypeFilter);
    if (makeFilter) chips.push(makeFilter);
    if (yearFilter) chips.push(yearFilter);
    featureFilter.forEach(feature => chips.push(feature));
    powerFilter.forEach(power => chips.push(`${power} power`));
    if (priceFilter.min || priceFilter.max) {
      const min = priceFilter.min ? `$${priceFilter.min}` : '$0';
      const max = priceFilter.max ? `$${priceFilter.max}` : '∞';
      chips.push(`${min} – ${max}`);
    }
    if (hasLocationFilter && radiusFilter !== 50) chips.push(`${radiusFilter} km radius`);
    return chips;
  }, [keyword, vehicleTypeFilter, makeFilter, yearFilter, featureFilter, powerFilter, priceFilter, radiusFilter, hasLocationFilter]);

  // apply all filters whenever dependencies change
  const applyFilter = useCallback(() => {
    let out = [...allVehicles];
    const params = route.params || {};
    const loc = params.location;
    const normalizedKeyword = keyword.trim().toLowerCase();
    const requestedStart = params.dates?.start ? new Date(params.dates.start) : null;
    const requestedEnd = params.dates?.end ? new Date(params.dates.end) : null;

    // → location
    if (loc && loc !== 'Anywhere') {
      if (typeof loc === 'string') {
        out = out.filter(c =>
          c.city?.toLowerCase().includes(loc.toLowerCase())
        );
        setSearchLabel(loc);
      } else if (loc.latitude != null && loc.longitude != null) {
        out = out.filter(c => {
          const d = getDistance(
            { latitude: loc.latitude, longitude: loc.longitude },
            c.location
          );
          return (d / 1000) <= (radiusFilter || 50);
        });
        setSearchLabel('Near me');
      }
    } else {
      setSearchLabel('Anywhere');
    }

    // → price
    if (priceFilter.min || priceFilter.max) {
      out = out.filter(c => {
        let ok = true;
        const nightly = c.dailyRate ?? c.price ?? 0;
        if (priceFilter.min) ok = nightly >= +priceFilter.min;
        if (priceFilter.max && ok) ok = nightly <= +priceFilter.max;
        return ok;
      });
    }

    if (requestedStart && requestedEnd && !Number.isNaN(+requestedStart) && !Number.isNaN(+requestedEnd)) {
      out = out.filter(c => {
        const availStart = c.availability?.start ? new Date(c.availability.start) : null;
        const availEnd = c.availability?.end ? new Date(c.availability.end) : null;
        if (availStart && availEnd && !Number.isNaN(+availStart) && !Number.isNaN(+availEnd)) {
          return availStart <= requestedStart && availEnd >= requestedEnd;
        }
        return true;
      });
    }

    // → vehicle type / make / year
    if (vehicleTypeFilter) out = out.filter(c => c.vehicleType === vehicleTypeFilter);
    if (makeFilter)         out = out.filter(c => (c.brand || c.make) === makeFilter);
    if (yearFilter)         out = out.filter(c => String(c.year) === yearFilter);

    if (featureFilter.length) {
      out = out.filter(c => {
        const ft = c.features || [];
        return featureFilter.every(tag => ft.includes(tag));
      });
    }

    if (powerFilter.length) {
      out = out.filter(c => {
        const power = (c.powerType || (c.electric ? 'Electric' : '')).toLowerCase();
        return powerFilter.some(p => power.includes(p.toLowerCase()));
      });
    }

    if (normalizedKeyword) {
      out = out.filter(c => {
        const haystack = [
          c.title,
          c.brand,
          c.make,
          c.model,
          c.vehicleType,
          c.description,
          c.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedKeyword);
      });
    }

    setFilteredVehicles(out);
  }, [
    allVehicles,
    route.params,
    priceFilter,
    radiusFilter,
    vehicleTypeFilter,
    makeFilter,
    yearFilter,
    featureFilter,
    powerFilter,
    keyword
  ]);

  // reset all filters
  const anyFilterActive = Boolean(
    priceFilter.min || priceFilter.max ||
    (hasLocationFilter && radiusFilter !== 50) ||
    vehicleTypeFilter || makeFilter || yearFilter ||
    featureFilter.length || powerFilter.length ||
    keyword.trim()
  );
  function resetFilters() {
    setPriceFilter({ min:'', max:'' });
    setRadiusFilter(50);
    setVehicleTypeFilter('');
    setMakeFilter('');
    setYearFilter('');
    setFeatureFilter([]);
    setPowerFilter([]);
    setKeyword('');
    setFilteredVehicles(allVehicles);
  }

  useEffect(() => { applyFilter(); }, [applyFilter]);

  function renderFilterModal() {
    switch (modalVisible.type) {
      case 'Price & distance':
        return (
          <Modal
            transparent
            visible
            onRequestClose={() => setModalVisible({ type: null })}
            animationType="slide"
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Daily price</Text>
                <View style={{ flexDirection:'row', gap:10 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Min"
                    placeholderTextColor={GlobalStyles.colors.gray600}
                    keyboardType="number-pad"
                    value={priceFilter.min}
                    onChangeText={min=>setPriceFilter(f=>({...f,min}))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Max"
                    placeholderTextColor={GlobalStyles.colors.gray600}
                    keyboardType="number-pad"
                    value={priceFilter.max}
                    onChangeText={max=>setPriceFilter(f=>({...f,max}))}
                  />
                </View>
                <View style={{ marginTop:16, width:'100%', alignItems:'center' }}>
                  <Text style={styles.modalSubtitle}>Search radius</Text>
                  <View style={styles.radiusRow}>
                    <TouchableOpacity
                      style={styles.radiusBtn}
                      onPress={() => setRadiusFilter(prev => Math.max(10, prev - 5))}
                    >
                      <Ionicons name="remove" size={18} color={GlobalStyles.colors.primary500} />
                    </TouchableOpacity>
                    <Text style={styles.radiusValue}>{radiusFilter} km</Text>
                    <TouchableOpacity
                      style={styles.radiusBtn}
                      onPress={() => setRadiusFilter(prev => Math.min(200, prev + 5))}
                    >
                      <Ionicons name="add" size={18} color={GlobalStyles.colors.primary500} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.radiusHint}>Adjusts distance when using a map or current location filter.</Text>
                </View>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={()=>{
                    setModalVisible({ type:null });
                    applyFilter();
                  }}
                >
                  <Text style={{color:'#fff',fontWeight:'bold'}}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      case 'Vehicle type':
      case 'Brand':
      case 'Year': {
        const list = modalVisible.type === 'Vehicle type'
          ? VEHICLE_TYPES
          : modalVisible.type === 'Brand'
            ? MAKES
            : YEARS;
        const keyName = modalVisible.type==='Year' ? 'year' : modalVisible.type==='Brand' ? 'brand' : 'vehicleType';
        const heading = modalVisible.type === 'Brand' ? 'Brand / Manufacturer' : modalVisible.type;
        return (
          <Modal
            transparent
            visible
            onRequestClose={() => setModalVisible({ type: null })}
            animationType="slide"
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{heading}</Text>
                {list.map(item=>(
                  <TouchableOpacity
                    key={item}
                    style={styles.pill}
                    onPress={()=>{
                      if (keyName==='vehicleType') setVehicleTypeFilter(item);
                      if (keyName==='brand')       setMakeFilter(item);
                      if (keyName==='year')        setYearFilter(item);
                      setModalVisible({ type:null });
                      applyFilter();
                    }}
                  >
                    <Text style={{ color:'#222',fontWeight:'bold' }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pill}
                  onPress={()=>{
                    if (keyName==='vehicleType') setVehicleTypeFilter('');
                    if (keyName==='brand')       setMakeFilter('');
                    if (keyName==='year')        setYearFilter('');
                    setModalVisible({ type:null });
                    applyFilter();
                  }}
                >
                  <Text style={{ color:'#aaa' }}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      }
      case 'Features':
        return (
          <Modal
            transparent
            visible
            onRequestClose={() => setModalVisible({ type: null })}
            animationType="slide"
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Amenities</Text>
                <View style={styles.filterChipRow}>
                  {FEATURE_TAGS.map(tag => {
                    const selected = featureFilter.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.pill, selected && styles.pillSelected]}
                        onPress={() => {
                          setFeatureFilter(prev =>
                            selected ? prev.filter(f => f !== tag) : [...prev, tag]
                          );
                        }}
                      >
                        <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                  <TouchableOpacity
                    style={[styles.pill,{ flex:1, marginRight:8 }]}
                    onPress={() => setFeatureFilter([])}
                  >
                    <Text style={{ color:'#aaa', textAlign:'center', fontWeight:'600' }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.applyBtn,{ flex:1 }]}
                    onPress={()=>{
                      setModalVisible({ type:null });
                      applyFilter();
                    }}
                  >
                    <Text style={{color:'#fff',fontWeight:'bold', textAlign:'center'}}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      case 'Power':
        return (
          <Modal
            transparent
            visible
            onRequestClose={() => setModalVisible({ type: null })}
            animationType="slide"
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Power source</Text>
                <View style={styles.filterChipRow}>
                  {POWER_TYPES.map(type => {
                    const selected = powerFilter.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.pill, selected && styles.pillSelected]}
                        onPress={() => {
                          setPowerFilter(prev =>
                            selected ? prev.filter(t => t !== type) : [...prev, type]
                          );
                        }}
                      >
                        <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                  <TouchableOpacity
                    style={[styles.pill,{ flex:1, marginRight:8 }]}
                    onPress={() => setPowerFilter([])}
                  >
                    <Text style={{ color:'#aaa', textAlign:'center', fontWeight:'600' }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.applyBtn,{ flex:1 }]}
                    onPress={()=>{
                      setModalVisible({ type:null });
                      applyFilter();
                    }}
                  >
                    <Text style={{color:'#fff',fontWeight:'bold', textAlign:'center'}}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      default:
        return null;
    }
  }

  return (
    <View style={styles.screen}>
      {/* — Search bar — */}
      <TouchableOpacity
        onPress={()=>navigation.navigate('SearchLocation')}
        activeOpacity={0.8}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={GlobalStyles.colors.gray700}/>
          <Text style={styles.searchInput}>{searchLabel}</Text>
        </View>
      </TouchableOpacity>

      <TextInput
        style={styles.keywordInput}
        value={keyword}
        onChangeText={setKeyword}
        placeholder="Search by title, brand, or features"
        placeholderTextColor={GlobalStyles.colors.gray600}
        returnKeyType="search"
      />

      {/* — Filters row — */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map(f=>(
          <TouchableOpacity
            key={f}
            style={styles.filterBtn}
            onPress={()=>setModalVisible({type:f})}
          >
            <Text style={styles.filterText}>{f}</Text>
            <Ionicons name="chevron-down-outline" size={16} color={GlobalStyles.colors.gray700}/>
          </TouchableOpacity>
        ))}
        {anyFilterActive && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={resetFilters}
          >
            <Ionicons name="close-circle-outline" size={18} color={GlobalStyles.colors.primary500}/>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {activeFilterChips.length ? (
        <View style={styles.activeFilterRow}>
          {activeFilterChips.map(chip => (
            <View key={chip} style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{chip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* — Map button — */}
      <TouchableOpacity
        style={styles.mapBtn}
        onPress={()=>navigation.navigate('VehicleMap',{ vehicles: filteredVehicles })}
      >
        <Ionicons name="map-outline" size={18} color={GlobalStyles.colors.primary500}/>
        <Text style={styles.mapBtnText}>See on map</Text>
      </TouchableOpacity>

      {/* — Header + subheader — */}
      <Text style={styles.header}>
        {filteredVehicles.length} vehicle{filteredVehicles.length===1?'':'s'} available
      </Text>
      <Text style={styles.subheader}>
        These vehicles can be picked up{' '}
        {searchLabel==='Anywhere'
          ? 'anywhere'
          : searchLabel==='Near me'
            ? 'near your location'
            : `in ${searchLabel}`
        }.
      </Text>

      {/* — Car list — */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={i=>i.id}
        renderItem={({item})=>(
          <VehicleCard
            vehicle={item}
            onPress={()=>navigation.navigate('VehicleDetail',{ vehicle:item })}
          />
        )}
        contentContainerStyle={styles.list}
      />

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex:1, backgroundColor:GlobalStyles.colors.primary50 },
  searchBar:   {
    flexDirection:'row',alignItems:'center',
    backgroundColor:'#fff',
    marginHorizontal:16,marginTop:10,marginBottom:8,
    paddingHorizontal:12,
    height:40,
    borderRadius:20,
    borderWidth:1,
    borderColor:GlobalStyles.colors.gray500,
  },
  searchInput: { flex:1, marginLeft:8, fontSize:16, color:GlobalStyles.colors.gray700 },
  keywordInput:{
    marginHorizontal:16,
    marginBottom:8,
    backgroundColor:'#fff',
    borderRadius:20,
    borderWidth:1,
    borderColor:GlobalStyles.colors.gray500,
    paddingHorizontal:14,
    paddingVertical:10,
    fontSize:16,
    color:GlobalStyles.colors.gray700
  },
  activeFilterRow:{
    flexDirection:'row',
    flexWrap:'wrap',
    marginHorizontal:16,
    marginBottom:8
  },
  activeFilterChip:{
    backgroundColor:GlobalStyles.colors.accent50,
    paddingHorizontal:12,
    paddingVertical:4,
    borderRadius:14,
    marginRight:6,
    marginBottom:6
  },
  activeFilterText:{
    fontSize:12,
    color:GlobalStyles.colors.gray700,
    fontWeight:'600'
  },

  filtersContainer:{
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:8,
    paddingVertical:6,
    marginBottom:2,
  },
  filterBtn:{
    flexDirection:'row',alignItems:'center',
    backgroundColor:'#fff',
    height:34,
    paddingHorizontal:14,
    marginRight:10,
    borderRadius:16,
    borderWidth:1,
    borderColor:GlobalStyles.colors.gray500,
  },
  filterText:{ fontSize:14, color:GlobalStyles.colors.gray700, marginRight:4 },
  resetBtn:{
    flexDirection:'row',alignItems:'center',
    backgroundColor:'#fff',
    height:34,
    paddingHorizontal:10,
    marginLeft:4,
    borderRadius:16,
    borderWidth:1,
    borderColor:GlobalStyles.colors.primary500,
  },
  resetBtnText:{ color:GlobalStyles.colors.primary500, fontWeight:'bold', marginLeft:3 },

  mapBtn:{
    alignSelf:'flex-end',
    flexDirection:'row',alignItems:'center',
    paddingHorizontal:14,paddingVertical:7,
    borderRadius:20,
    backgroundColor:'#fff',
    borderWidth:1,
    borderColor:GlobalStyles.colors.primary500,
    marginRight:16,marginBottom:8,
  },
  mapBtnText:{ color:GlobalStyles.colors.primary500, fontWeight:'bold', marginLeft:6 },

  header:{
    fontSize:18,fontWeight:'700',
    marginHorizontal:16,marginTop:8,
    color:GlobalStyles.colors.gray700,
  },
  subheader:{
    fontSize:14,
    color:GlobalStyles.colors.gray500,
    marginHorizontal:16,marginBottom:6,marginTop:0,
  },

  list:{ paddingHorizontal:16, paddingBottom:16 },

  // modal styles
  modalBackdrop:{
    flex: 1,
    backgroundColor:'rgba(0,0,0,0.2)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalContent:{
    width:300,
    backgroundColor:'#fff',
    borderRadius:14,
    padding:20,
    alignItems:'center',
    elevation:5
  },
  modalTitle:{
    fontWeight:'bold',
    fontSize:18,
    marginBottom:14,
    color:GlobalStyles.colors.primary700
  },
  modalSubtitle:{
    fontSize:14,
    fontWeight:'600',
    color:GlobalStyles.colors.gray700,
    alignSelf:'flex-start'
  },
  input:{
    borderColor:GlobalStyles.colors.gray500,
    borderWidth:1,
    borderRadius:6,
    paddingHorizontal:10,
    paddingVertical:6,
    marginBottom:10,
    fontSize:16,
    backgroundColor:'#f6f6f6',
    minWidth:70,
    color:GlobalStyles.colors.gray700,
    textAlign:'center'
  },
  applyBtn:{
    marginTop:10,
    backgroundColor:GlobalStyles.colors.primary500,
    paddingHorizontal:26,
    paddingVertical:10,
    borderRadius:7
  },
  radiusRow:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    marginTop:8
  },
  radiusBtn:{
    width:40,
    height:40,
    borderRadius:20,
    borderWidth:1,
    borderColor:GlobalStyles.colors.primary500,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#fff'
  },
  radiusValue:{
    marginHorizontal:16,
    fontSize:18,
    fontWeight:'700',
    color:GlobalStyles.colors.gray700
  },
  radiusHint:{
    marginTop:8,
    fontSize:12,
    color:GlobalStyles.colors.gray500,
    textAlign:'center'
  },
  pill:{
    backgroundColor:'#f6f6f6',
    padding:10,
    borderRadius:10,
    marginVertical:4,
    minWidth:140,
    alignItems:'center'
  },
  filterChipRow:{
    flexDirection:'row',
    flexWrap:'wrap',
    justifyContent:'flex-start'
  }
});
