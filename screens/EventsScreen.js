import React from 'react';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import Expo from 'expo';

import Colors from '../constants/Colors';
import NavScreen from './NavScreen';
import Firebase from '../util/Firebase';
import Hr from '../components/Hr';
import EventListing from '../components/EventListing';
import InlineInputField from '../components/InlineInputField';

import * as firebase from 'firebase';

const { width, height } = Dimensions.get('screen');
const viewportWidth = width - 20;

class ModalButton extends React.Component {
  render() {
    return (
      <View style={styles.modalButtonContainer}>
        <TouchableOpacity onPress={() => this.props.onPress()}>
          <View style={styles.modalButton}>
            <Text style={styles.modalButtonText}>
              {this.props.text}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}


class EventsScreen extends React.Component {
  hr = (
    <Hr
      wrapperStyle={styles.hrWrapperStyle}
      lineStyle={styles.hrLineStyle}
    />
  );

  state = {
    eventListings: [],
    favoritedEvents: {},
    eventsRef: firebase.database().ref('events/'),
    loading: true,
  }

  componentDidMount() {
    this._addEventListeners();  
  }

  componentWillUnmount() {
    const { eventsRef } = this.state;
    eventsRef.off('child_added');
    eventsRef.off('child_changed');
    this.setState({ loading: true });
  }

  _addEventListeners() {
    const { eventsRef } = this.state;
    eventsRef.on('child_added', data => this._onEventUpdate(data));
    eventsRef.on('child_changed', data => this._onEventUpdate(data));
  }

  _onEventUpdate(data) {
    this.setState({ loading: false });
    this.setState(prevState => {
      const key = data.key;
      const eventData = data.val();
      const eventListings = prevState.eventListings.slice();
      if (eventListings.filter(listing => listing.key === key).length !== 0) {
        return; // makes sure we don't add events twice
        // TODO: update the event's data if it has changed
      }
      
      const events = [{ key: key, data: eventData }].concat(eventListings);

      return { eventListings: events };
    });
  }

  // TODO: remove listeners on unmount?

  _createEventListing(eventId, eventData) {
    return (
      <EventListing 
        key={eventId}
        eventId={eventId}
        info={eventData}
        toggleFavorite={this._toggleFavorite.bind(this, eventId)}
      />
    );
  }

  _toggleFavorite(eventId) {
    Firebase.toggleEventFavorite(eventId);
    const state = this.state.favoritedEvents;
    if (state[eventId]) {
      state[eventId] = false;
    }
    else {
      state[eventId] = true;
    }
    this.setState({ favoritedEvents: state });
  }

  render() {
    const { loading } = this.state;
    return (
      <View style={styles.container}>
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
            data={this.state.eventListings}
            renderItem={({item}) => this._createEventListing(item.key, item.data)}
            style={styles.eventListContainer}
            removeClippedSubviews={false}
            ItemSeparatorComponent={() => this.hr}
          />
        }
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => this.props.navigation.navigate('CreateEventScreen')}>
            <View style={styles.createEventButton}>
              <Text style={styles.createEventButtonText}>
                CREATE AN EVENT
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10,
  },
  header: {
    marginVertical: 10,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 18,
    color: Colors.tabIconSelected,
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
  hrLineStyle: {
  },
  eventListContainer: {
    flex: 1,
  },
  footer: {
    height: 44,
  },
  createEventButton: {
    backgroundColor: Colors.tabIconSelected,
    marginVertical: 5,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: viewportWidth,
    alignSelf: 'center',
  },
  createEventButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'CarterSansPro-Bold',
  },
  modalButtonContainer: {
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  modalButton: {
    backgroundColor: Colors.tabIconSelected,
    paddingVertical: 10,
    alignItems: 'center',
    width: 200,
    marginBottom: 5,
  },
  activityIndicator: {
    flex: 1,
    alignSelf: 'center',
  },
});

export default EventsScreen;
