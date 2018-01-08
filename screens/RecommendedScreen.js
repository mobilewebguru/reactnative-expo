import React from 'react';

import {
  Image,
  Button,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  FlatList,
  Picker,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';

import Expo from 'expo';
import * as firebase from 'firebase';
import GeoFire from 'geofire';

import Firebase from '../util/Firebase';
import Hr from '../components/Hr';
import SearchBar from '../components/SearchBar';

import ModalDropdown from 'react-native-modal-dropdown';

import Colors from '../constants/Colors';

import RecommendationListing from '../components/RecommendationListing';

const { width, height } = Dimensions.get('window');

const viewportWidth = width - 20;

const allowedRecommenders = [
  'IKxpWZCs1hQP0fLiWGfOrGGM07f2', // Matt Smith
  'XEtC569i5lTAcGbB2YUNJl70PUd2', // Stu Harvey
];

const kilometersPerMile = 0.62137119;
const milesPerKilometer = 1.609344;

class RecommendedScreen extends React.Component {
  state = {
    recommendations: {},
    recommendationList: [],
    favorited: {},
    category: 'all',
    searchInputValue: null,
    searchFilter: '',
    loading: true,
    userId: Firebase.getAuthenticatedUser().uid,
    geoFire: new GeoFire(firebase.database().ref('geofire/recommendations')),
    userLocation: null,
    geoQuery: null,
    recoInfoModalVisible: false,
  }

  favoritedImageActive = (
    <Image 
      source={require('../assets/images/saved_icon_active.png')}
      style={styles.favoriteImageStyle}
    />
  );

  favoritedImageInactive = (
    <Image 
      source={require('../assets/images/saved_icon.png')}
      style={styles.favoriteImageStyle}
    />
  );  

  hr = (
    <Hr
      wrapperStyle={styles.hrWrapperStyle}
      lineStyle={null}
    />
  )

  componentWillMount() {  
    this._addEventListeners();
  }

  componentWillUnmount() {
    if (this.recommendationRef) {
      this.recommendationRef.off('child_added');
      this.recommendationRef.off('child_changed');
    }
    if (this.state.geoQuery) {
      this.state.geoQuery.cancel(); // cancel all geoquery callbacks
    }
    this.setState({ loading: true });
  }

  _addEventListeners() {
    this._startGeoQuery();

    const recommendationRef = firebase.database().ref('recommendations/');
    // recommendationRef.on('child_added', data => this._onRecommendationUpdate(data));
    // recommendationRef.on('child_changed', data => this._onRecommendationUpdate(data));
    this.recommendationRef = recommendationRef;
  }

  async _startGeoQuery() {
    const { geoFire } = this.state;

    // determine the user's location so we can fetch nearby recommendations
    const userInfo = await Firebase.getCurrentUser();
    const location = userInfo.location;
    if (!location) {
      console.log('Error: User location is unknown');
      return;
    }

    // build the geoQuery for nearby recommendations
    const geoQuery = geoFire.query({
      center: [location.latitude, location.longitude],
      radius: 250 * milesPerKilometer, // radius is in km
    });

    geoQuery.on(
      'key_entered', // fires when a key enters the radius of this geoquery
      (key, location, distance) => {
        const ref = firebase.database().ref(`recommendations/${key}`);
        ref.once('value', data => this._onRecommendationUpdate(data));
      }
    );

    this.setState({
      geoQuery: geoQuery,
      userLocation: location,
      queryRadius: 250 * milesPerKilometer,
    });
  }

  _expandGeoQuery(radiusMultiplier = 1.5) {
    const { geoQuery, queryRadius } = this.state;

    if (geoQuery == null || queryRadius > 40000) {
      // if queryRadius > 40000, it is larger than the circumference of the Earth
      return;
    }

    const newRadius = queryRadius * radiusMultiplier;
    const newQueryOptions = {
      radius: newRadius,
    };

    geoQuery.updateCriteria(newQueryOptions);
    this.setState({ queryRadius: newRadius });
  }

  _onRecommendationUpdate(data) {
    const { userLocation } = this.state;
    if (this.state.loading) {
      this.setState({ loading: false });
    }
    const key = data.key;
    const recommendation = data.val();
    if (!recommendation.hidden) {
      if (userLocation && recommendation.coordinate) {
        recommendation.distance = distanceBetween(userLocation, recommendation.coordinate);
      }
      this.setState(previousState => {
        const recommendations = Object.assign({}, previousState.recommendations);
        recommendations[data.key] = recommendation;

        const recommendationList = previousState.recommendationList.slice();
        recommendationList.push({
          key: key,
          data: recommendation,
        });

        recommendationList.sort((a, b) => compareRecommendations(a.data, b.data));

        return { 
          recommendationList: recommendationList, 
          recommendations: recommendations,
        };
      });
    }
  }

  _renderRecommendation(id, data) {
    const { favorited } = this.state;
    const category = this.state.category.toLowerCase();
    if (category !== 'all' && data.category.toLowerCase() !== category) {
      return null;
    }
    return (
      <RecommendationListing
        key={id}
        recommendationId={id}
        info={data}
        toggleFavorite={this._toggleFavorite.bind(this, id)}
        favoritedImage={favorited[id] ? this.favoritedImageActive : this.favoritedImageInactive}
      />
    );
  }

  _toggleFavorite(id) {
    Firebase.toggleRecommendationFavorite(id);
    const favorited = this.state.favorited;
    // could do this in fewer lines but this handles undefined better
    if (favorited[id]) { 
      favorited[id] = false;
    }
    else {
      favorited[id] = true;
    }
    this.setState({ favorited: favorited });
  }

  _toggleInfoModal() {
    this.setState(prevState => {
      return { recoInfoModalVisible: !prevState.recoInfoModalVisible};
    });
  }

  _search() {
    const { recommendationList, searchInputValue } = this.state;
    const { navigate } = this.props.navigation;

    navigate('Explore', {
      searchLocation: searchInputValue,
    });
    // do a bfs to see if any of the recommendations contain the current search
    // terms?

    // for (const recommendation of recommendations) {
    //   const title = recommendation.title.toLowerCase();
    //   const description = recommendation.description.toLowerCase();
    //   const searchVal = searchInputValue.toLowerCase();

    //   if (title.includes(searchVal) || description.includes(searchVal)) {
    //     recommendation.filtered = true;
    //   }
    // }

    // return null;
  }

  render() {
    const { 
      searchInputValue, 
      loading, 
      userId, 
      recoInfoModalVisible 
    } = this.state;
    return (
      <View style={styles.container}>
        <Modal
          animationType="slide"
          visible={recoInfoModalVisible}
          transparent={true}
          onPress={e => console.log(e)}>
          <View style={{alignSelf: 'center', margin: 20, padding: 10, backgroundColor: '#fff', borderWidth: 1,}}>
            <Text style={[styles.header, { alignSelf: 'center'}]}>
              MAKING A RECOMMENDATION
            </Text>
            <View style={{ padding: 10, flexDirection: 'column', justifyContent: 'space-between',}}>
              <Text style={{marginBottom: 5}}>
                Know the perfect spot to stop for a bite after a day on the water?
                Got a favorite marina to stow your boat?
                Own a one-stop woody boat shop?
              </Text>
              <Text>
                Email matt@woodyboater.com or send him a chat to get it added to the app.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dismissModalButton}
              onPress={() => this._toggleInfoModal()}>
              <Text style={styles.dismissModalButtonText}>
                GOT IT
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Text style={styles.header}>
          RECOMMENDED
        </Text>
        <View style={styles.searchBar}>
          <ModalDropdown 
            style={styles.pickerButton} 
            textStyle={styles.pickerText}
            defaultValue="CATEGORY ▼"
            options={['ALL', 'DINING', 'LODGING', 'BOATING']} 
            onSelect={(index, value) => this.setState({ category: value })}
            dropdownStyle={styles.dropdown}
          />
          <SearchBar 
            containerStyle={styles.searchContainer}
            textStyle={styles.searchBarText}
            backgroundColor={Colors.defaultBackground}
            placeholder="SEARCH"
            onChangeText={text => this.setState({ searchInputValue: text })}
            value={this.state.searchInputValue}
            onSubmitEditing={() => this._search()}
          />
        </View>
        { loading &&
          <ActivityIndicator 
            animating
            size="large"
            style={styles.activityIndicator} 
            color={Colors.tabIconDefault}
          />
        }
        { !loading &&
          <FlatList 
            style={styles.scrollViewContainer}
            data={this.state.recommendationList.filter(data => {
              if (data.filtered) {
                return false;
              }
              const currentCategory = this.state.category.toLowerCase();
              const category = data.data.category.toLowerCase();
              return currentCategory === 'all' || category === currentCategory;
            })}
            onEndReached={() => this._expandGeoQuery()}
            onEndReachedThreshold={0.9}
            initialNumToRender={5}
            renderItem={({item}) => this._renderRecommendation(item.key, item.data)}
            ItemSeparatorComponent={() => this.hr}
            removeClippedSubviews={false}
          />
        }
        { allowedRecommenders.includes(userId) &&
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('CreateRecommendationScreen')}>
              <View style={styles.createRecommendationButton}>
                <Text style={styles.createRecommendationButtonText}>
                  RECOMMEND A PLACE
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        { !allowedRecommenders.includes(userId) && 
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => this._toggleInfoModal()}>
              <View style={styles.createRecommendationButton}>
                <Text style={styles.createRecommendationButtonText}>
                  GOT A RECOMMENDATION?
                </Text>
              </View>
            </TouchableOpacity>
          </View>          
        }
      </View>
    );
  }
}

const compareRecommendations = (first, second) => {
  if (first.distance && second.distance) {
    return first.distance - second.distance;
  }
  else if (first.distance) {
    return -1;
  }
  else if (second.distance) {
    return 1;
  }
  else if (first.recommended && !second.recommended) {
    return -1;
  }
  else if (!first.recommended && second.recommended) {
    return 1;
  }
  return first.title.localeCompare(second.title);
};

const distanceBetween = (coordObjectA, coordObjectB) => {
  const location1 = [coordObjectA.latitude, coordObjectA.longitude];
  const location2 = [coordObjectB.latitude, coordObjectB.longitude];

  return GeoFire.distance(location1, location2) * kilometersPerMile;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  footer: {
    height: 44,
  },
  dismissModalButtonText: {
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 12,
    color: Colors.tabIconDefault,
    textAlign: 'center',
  },
  dismissModalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.inactiveBackground,
    paddingVertical: 10,
    alignItems: 'center',
    height: 44,
    margin: 5,
    borderRadius: 5,
  },  
  hrWrapperStyle: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: 10,
    borderBottomColor: Colors.searchBackground,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  header: {
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 18,
    color: Colors.tabIconSelected,
  },
  scrollViewContainer: {
    flex: 1,
  },
  createRecommendationButton: {
    backgroundColor: Colors.tabIconSelected,
    marginVertical: 5,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: viewportWidth,
    alignSelf: 'center',
  },
  createRecommendationButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'CarterSansPro-Bold',
  },
  searchBar: {
    flexDirection: 'row',
    height: 50,
  },
  pickerButton: {
    width: viewportWidth * .4,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarText: {
    textAlign: 'center',
    color: 'rgb(142, 138, 127)',
    width: viewportWidth * .6,
    backgroundColor: 'rgb(238, 238, 238)',
    paddingVertical: 5,
    fontFamily: 'CarterSansPro-Bold',
    height: 40,
    fontSize: 13,
  },
  pickerText: {
    fontFamily: 'CarterSansPro-Bold',
    width: viewportWidth * .35,
    height: 40,
    textAlign: 'center',
    paddingTop: 11,
    backgroundColor: 'rgb(238, 238, 238)',
    color: 'rgb(142, 138, 127)',
  },
  dropdown: { 
    width: viewportWidth * .35, 
    height: 135, 
    left: 0,
  },
  favoriteImageStyle: {
    width: 16,
    height: 16,
  },
  activityIndicator: {
    flex: 1,
    alignSelf: 'center',
  },
});

export default RecommendedScreen;
