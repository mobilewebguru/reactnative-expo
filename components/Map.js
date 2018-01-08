/*
---
Clustering markers:
  - onPress, get markers within some radius of the press, then zoomToFit markers

---
*/

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  TouchableHighlight,
  Keyboard,
 } from 'react-native';

import Expo, { MapView, Location, Permissions } from 'expo';

import Callout from '../components/Callout';
import Firebase from '../util/Firebase';
import Colors from '../constants/Colors';
import SearchBar from '../components/SearchBar';
import GeoFire from 'geofire';

import RecommendationListing from './RecommendationListing';

import Geocoder from 'react-native-geocoding';
Geocoder.setApiKey('AIzaSyBpWhmQmx1cXVJq9Oihx19rTJ9yfRAt9po');

import * as firebase from 'firebase';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 38.889175,
  longitude: -77.169065,
  latitudeDelta: 0.0230,
  longitudeDelta: 0.010525,
};

class Map extends React.Component {
  state = {
    users: {},
    recommendations: {},
    activeCallout: null,
    location: null,
    initialLocationDetermined: false,
    activeFilters: {
      'All': true,
      'Dining': false,
      'Lodging': false,
      'Boating': false,
      'Boaters': false,
    },
    searchInputValue: null,
    chatButtonPressed: false,
    usersRef: firebase.database().ref('users/'),
    recommendationsRef: firebase.database().ref('recommendations/'),
    gfUsers: new GeoFire(firebase.database().ref('geofire/users')),
    gfRecommendations: new GeoFire(firebase.database().ref('geofire/recommendations')),
    userQuery: null,
    recoQuery: null,
  }

  callouts = {}

  async componentWillMount() {
    const { params } = this.props.navigation.state;
    
    const currentUser = global.userInfo || await Firebase.getCurrentUser();
    // use the user's last known location
    if (currentUser.location) {
      this._setInitialLocation(currentUser.location);
    }
    // Listen for user authentication
    this._addEventListeners();

    if (params && params.searchLocation) {
      await this.setState({ searchInputValue: params.searchLocation });
      this._search();
    }
  }

  _setInitialLocation(location) {
    const initialRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0230,
      longitudeDelta: 0.010525,
    };
    this.setState({ 
      initialLocationDetermined: true,
      location: location,
      initialRegion: initialRegion
    });
  }

  async componentWillReceiveProps(newProps) {
    const { params } = newProps.navigation.state;
    if (params && params.searchLocation) {
      await this.setState({ searchInputValue: params.searchLocation });
      this._search();
    }
  }

  async _addEventListeners() {
    await this._addUserLocationListener();

    this._addGeoQueries();

    // User updates
    // usersRef.on('child_added', data => this._onUserUpdate(data));
    // usersRef.on('child_changed', data => this._onUserUpdate(data));
    // usersRef.on('child_removed', data => this._onUserDelete(data));

    // Recommendation updates
    // recommendationsRef.on('child_added', data => this._onRecommendationUpdate(data));

  }

  _updateGeoQueries(region) {
    const { userQuery, recoQuery, initialLocationDetermined } = this.state;
    if (userQuery == null || recoQuery == null || !initialLocationDetermined) {
      return;
    }
    const center = [region.latitude, region.longitude];
    const rightmostCoord = [region.latitude, region.longitude + region.longitudeDelta];
    const radius = GeoFire.distance(center, rightmostCoord);

    const newQueryOptions = {
      center: center,
      radius: radius,
    };
    userQuery.updateCriteria(newQueryOptions);
    recoQuery.updateCriteria(newQueryOptions);
  }

  _addGeoQueries() {
    const { gfRecommendations, gfUsers, location } = this.state;    
    const queryOptions = {
      center: [location.latitude, location.longitude],
      radius: 100,
    };
    const userQuery = gfUsers.query(queryOptions);
    const recoQuery = gfRecommendations.query(queryOptions);

    userQuery.on(
      'key_entered',
      (userId, location, distance) => {
        const ref = firebase.database().ref(`users/${userId}`);
        ref.once('value', data => this._onUserUpdate(data));
      }
    );

    recoQuery.on(
      'key_entered',
      (id, location, distance) => {
        const ref = firebase.database().ref(`recommendations/${id}`);
        ref.once('value', data => this._onRecommendationUpdate(data));
      }
    );

    this.setState({
      userQuery: userQuery,
      recoQuery: recoQuery,
    });
  }

  // Stores recommendation data and attempts to geolocate
  _onRecommendationUpdate(data) {
    const id = data.key;
    const recommendation = data.val();

    const recommendations = this.state.recommendations;
    if (!recommendation.address) {
      return;
    }
    else if (!recommendation.coordinate) {
      Geocoder.getFromLocation(recommendation.address).then(
        json => {
          const coord = json.results[0].geometry.location;
          const markerCoord = {
            latitude: coord.lat,
            longitude: coord.lng,
          };
          console.log('Added recommendation ' + id);
          console.log('\tCoord: ' + coord.lat + ', ' + coord.lng);
          recommendation.coordinate = markerCoord;
        },
        error => {
          console.log(error);
        },
      );
    }

    recommendations[id] = recommendation;

    this.setState({ recommendations: recommendations });
  }

  _addUserLocationListener = async () => {
    // ask for permission to get user's location
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    const { params } = this.props.navigation.state;
    const user = await Firebase.getCurrentUser();
    const userId = Firebase.getAuthenticatedUser().uid;
    const url = 'users/' + userId + '/location';
    const userLocationRef = firebase.database().ref(url);
    const onUpdate = async update => {
      const coords = update.coords;
      this.setState({ location: coords });
      if (!this.state.initialLocationDetermined) {
        const initialRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.0230,
          longitudeDelta: 0.010525,
        };
        if (!(params && params.searchLocation)) {
          this._map.animateToRegion(initialRegion, 300);
        }
        this.setState({ initialLocationDetermined: true });
      }
      userLocationRef.set(coords);
    };
    if (status !== 'granted' && user.city && user.state) {
      Geocoder.getFromLocation(user.city + ', ' + user.state).then(
        json => {
          const coord = json.results[0].geometry.location;
          const update = {
            coords: {
              latitude: coord.lat,
              longitude: coord.lng,
            }
          };
          onUpdate(update);
        }
      );
    }
    else if (user.useExactLocation) {
      this.locationListener = await Location.watchPositionAsync(
        {
          timeInterval: 60 * 1000,
          enableHighAccuracy: false,
          distanceInterval: 0,
        }, 
        async update => await onUpdate(update)
      );
    }
  }

  _onUserUpdate(data) {
    // set user fields to match API doc
    const userId = data.key;
    const userData = data.val();
    let user = userData;
    user.username = userId;
    user.location_lat_lng = user.location;
    if (user.city && user.state) {
      user.location_city_state = user.city + ', ' + user.state;
    }
    if (user.showContactInfo && user.email && user.phone) {
      user.contact = {
        email: user.email,
        phone: user.phone,
      };
    }
    // update state with users data
    const users = this.state.users;
    users[userId] = user;
    this.setState({
      users: users,
    });
  }

  _onUserDelete(data) {
    const userId = data.key;
    const users = this.state.users;
    delete users[userId];
    this.setState({ users: users });
  }

  _toggleFavorite(id) {
    Firebase.toggleRecommendationFavorite(id);
  }

  _toggleCallout(id) {
    if (this.state.activeCallout === id) {
      this.setState({ activeCallout: null });
    }
    else {
      // activate the callout and center it on the map
      this.setState({ activeCallout: id });
      if (id in this.state.users) {
        this._map.animateToCoordinate(this.state.users[id].location_lat_lng, 300);
      }
      else {
        this._map.animateToCoordinate(this.state.recommendations[id].coordinate, 300);
      }
    }
  }

  _handlePress(event) {
    Keyboard.dismiss();
    console.log(event.coordinate);
    if (event.action && event.action === 'marker-press') {
      return;
    }
    if (this.state.activeCallout !== null) {
      this._toggleCallout(this.state.activeCallout);
    }
  }

  _createUserMarkers(users) {
    return Object.keys(users).map(userId => {
      const user = users[userId];
      if (!user.showOnMap) {
        return null;
      }
      return (
        <MapView.Marker
          coordinate={user.location_lat_lng}
          key={userId}
          image={require('../assets/images/blank_pixel.png')}
          onPress={() => this._toggleCallout(userId)}>
          <TouchableOpacity>
            <UserMarkerImage />
          </TouchableOpacity>
        </MapView.Marker>
      );
    });
  }

  /**
   * Returns a filter component which is colored based on its state
   */
  _renderFilter(name) {
    return (
      <FilterText
        text={name}
        active={this.state.activeFilters[name]}
        onPress={() => this._handleFilterPress(name)}
      />
    );
  }

  /**
   * Updates the filter states based on which was pressed
   * When 'All' is pressed, all others are set to inactive (but still
   * displayed)
   * Every other filter works as a toggle
   */
  _handleFilterPress(name) {
    if (name === 'All') {
      this.setState({
        activeFilters: {
          'All': true,
          'Dining': false,
          'Lodging': false,
          'Boating': false,
          'Boaters': false,
        }
      });
    }
    else {
      const state = this.state.activeFilters;
      state['All'] = false;
      state[name] = !state[name];
      this.setState({activeFilters: state});
    }
  }

  _userCallout(id) {
    // Verify there is actually a callout to render
    if (!this.state.users[id]) {
      return null;
    }

    if (!this.callouts[id]) {
      const user = this.state.users[id];
      this.callouts[id] = (
        <Callout
          title={user.name}
          description={user.bio}
          info={user}
          chatButtonPress={() => {
            this.setState({ chatButtonPressed: true });
            this._onChatButtonPress(id);
          }}
          chatButtonPressed={this.state.chatButtonPressed}
        />
      );
    }

    return this.callouts[id];
  }

  // targetUserId is the ID of the user to chat with
  async _onChatButtonPress(targetUserId) {
    const { navigate } = this.props.navigation;

    // check if there's a chat room created for these users already
    const currentUser = await Firebase.getCurrentUser();
    const userChats = currentUser.chats;

    let chatToJoinId = -1;
    for (const chatId of Object.keys(userChats)) {
      const chatMembers = userChats[chatId];
      if (chatMembers.length === 2 && chatMembers.includes(targetUserId)) {
        chatToJoinId = chatId;
      }
    }

    const targetUser = this.state.users[targetUserId];
    const title = targetUser.name.split(' ')[0];

    if (chatToJoinId !== -1) { // chat already exists
      // fetch chat metadata then navigate to the chat screen
      const chatInfoRef = firebase.database().ref(`chats/${chatToJoinId}`);
      chatInfoRef.once('value', data => {
        const chatInfo = data.val();
        chatInfo.title = title;
        navigate('ChatView', {
          id: chatToJoinId,
          info: chatInfo,
        });
        this.setState({ chatButtonPressed: false });
      });
    }
    else { // chat needs to be created
      const { id, info } = await Firebase.createChat([
        Firebase.getAuthenticatedUser().uid,
        targetUserId,
      ]);
      info.title = title;
      navigate('ChatView', {
        id: id,
        info: info,
      });
      this.setState({ chatButtonPressed: false });
    }
  }

  _recoCallout(id) {
    if (!this.state.recommendations[id]) {
      return null;
    }

    if (!this.callouts[id]) {
      const recommendation = this.state.recommendations[id];
      this.callouts[id] = (
        <View style={styles.recoCallout}>
          <RecommendationListing
            key={id}
            recommendationId={id}
            info={recommendation}
            toggleFavorite={() => this._toggleFavorite(id)}
          />
        </View>
      );
    }

    return this.callouts[id];
  }

  _createRecoMarkers(recommendations) {
    return Object.keys(recommendations).map(id => {
      const recommendation = recommendations[id];
      if (!recommendation.coordinate) {
        return null;
      }

      return (
        <MapView.Marker
          key={`recommendation-${id}`}
          coordinate={recommendation.coordinate}
          image={require('../assets/images/blank_pixel.png')}
          onPress={() => this._toggleCallout(id)}>
          <TouchableOpacity>
            <RecommendationMarkerImage 
              color={recommendation.recommended ? 'blue' : 'grey'}
              category={recommendation.category.toLowerCase()}
            />
          </TouchableOpacity>
        </MapView.Marker>
      );
    });
  }

  _search() {
    // search for users?
    const { searchInputValue } = this.state;
    const map = this._map;
    Geocoder.getFromLocation(searchInputValue).then(
      json => {
        const region = this._regionFromViewport(json.results[0].geometry.viewport);
        map.animateToRegion(region, 300);
      },
      error => {
        console.log(error.message);
      }
    );
  }

  _regionFromViewport(viewport) {
    const ne = viewport.northeast;
    const sw = viewport.southwest;
    const region = {
      latitude: (ne.lat + sw.lat) / 2,
      longitude: (sw.lng + ne.lng) / 2,
      latitudeDelta: (ne.lat - sw.lat) * 1.05,
      longitudeDelta: (ne.lng - sw.lng) * 1.05,
    };
    return region;
  }

  render() {
    if (!Firebase.getAuthenticatedUser()) {
      return (
        <View />
      );
    }
    const { users, recommendations, activeCallout, initialRegion } = this.state;
    const location = this.state.location;
    const filters = this.state.activeFilters;
    const userMarkers = this._createUserMarkers(users);
    const recoMarkers = this._createRecoMarkers(recommendations);
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          showsMyLocationButton={true}
          showsPointsOfInterest={true}
          rotateEnabled={false}
          ref={map => this._map = map}
          onPress={e => this._handlePress(e.nativeEvent)}
          onRegionChangeComplete={e => this._updateGeoQueries(e)}
          onMarkerPress={e => {
            console.log(e.nativeEvent.target);
            console.log(Object.keys(e));
            console.log(Object.keys(e.nativeEvent));
          }}
          initialRegion={initialRegion}>
          { location && location.accuracy && (filters['All'] || filters['Boaters']) && 
            <MapView.Circle
              key={(location.latitude + location.longitude + location.accuracy).toString()}
              center={location}
              radius={location.accuracy}
              strokeColor="rgba(223, 31, 38, 0.5)"
              fillColor="rgba(223, 31, 38, 0.2)"
            />
          }
          { (filters['All'] || filters['Boaters']) && 
            userMarkers
          }
          { (filters['All'] || filters['Boating']) && 
            recoMarkers
          }
        </MapView>
        { activeCallout && activeCallout in users &&
          this._userCallout(activeCallout)
        }
        { activeCallout && activeCallout in recommendations &&
          this._recoCallout(activeCallout)
        }
        <View style={styles.searchBar}>
          <SearchBar
            containerStyle={styles.searchBarContainer}
            textStyle={styles.searchBarText}
            placeholder="GOIN SOMEWHERE?"
            onChangeText={text => this.setState({ searchInputValue: text })}
            value={this.state.searchInputValue}
            onSubmitEditing={() => this._search()}
          />
          <View style={styles.filterTextContainer}>
            {this._renderFilter('All')}
            {this._renderFilter('Dining')}
            {this._renderFilter('Lodging')}
            {this._renderFilter('Boating')}
            {this._renderFilter('Boaters')}
          </View>
        </View>
      </View>
    );
  }
}

class FilterText extends React.Component {
  render() {
    return (
      <TouchableHighlight
        onPress={() => this.props.onPress()}
        underlayColor={Colors.defaultBackground}>
        <Text style={[
          styles.textInactive,
          this.props.active && styles.textActive
        ]}>
          {this.props.text.toUpperCase()}
        </Text>
      </TouchableHighlight>
    );
  }
}

class UserMarkerImage extends React.Component {
  state = {
    imageLoaded: false,
  }

  render() {
    return (
      <Image 
        source={require('../assets/images/user_marker.png')}
        style={styles.markerImage}
        onLoad={() => this.setState({ imageLoaded: true })}
        key={`imageLoaded-${this.state.imageLoaded}`}
      />
    );
  }
}

class RecommendationMarkerImage extends React.Component {
  state = {
    imageLoaded: false,
  }

  render() {
    return (
      <Image 
        source={markerImageSources[this.props.category][this.props.color]}
        style={styles.recoImage}
        onLoad={() => this.setState({ imageLoaded: true })}
        key={`imageLoaded-${this.state.imageLoaded}`}
      />
    );
  }
}

const markerImageSources = {
  food: {
    red: require('../assets/images/food_red.png'),
    blue: require('../assets/images/food_blue.png'),
    grey: require('../assets/images/food_grey.png'),
  },
  lodging: {
    red: require('../assets/images/lodging_red.png'),
    blue: require('../assets/images/lodging_blue.png'),
    grey: require('../assets/images/lodging_grey.png'),    
  },
  boating: {
    red: require('../assets/images/boating_red.png'),
    blue: require('../assets/images/boating_blue.png'),
    grey: require('../assets/images/boating_grey.png'),    
  },
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: { 
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  markerImage: {
    height: 32,
    width: 32,
  },
  recoImage: {
    height: 28,
    width: 28,
  },
  recoCallout: { 
    width: width - 20, 
    paddingBottom: 10, 
  },
  searchBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: Colors.defaultBackground,
  },
  textActive: {
    color: Colors.tabIconSelected,
  },
  textInactive: {
    fontFamily: 'Lato-Bold',
    fontSize: 11,
    color: Colors.tabIconDefault,
  },
  filterTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginLeft: 15,
    marginRight: 15,
    backgroundColor: Colors.defaultBackground,
  },
  searchBarContainer: {
    flex: 1,
    padding: 10,
  },
  searchBarText: {
    fontFamily: 'Lato-Bold',
    backgroundColor: 'rgb(238, 238, 238)',
    textAlign: 'center',
    fontSize: 12,
    height: 30,
  },
});

export default Map;