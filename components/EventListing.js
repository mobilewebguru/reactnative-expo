import React from 'react';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';

import Colors from '../constants/Colors';
import Firebase from '../util/Firebase';


import * as firebase from 'firebase';

class EventListing extends React.Component {
  state = {
    attendees: this.props.info.attendees || [],
  }

  componentDidMount() {
    this._addListeners();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.collapsed) {
      this.setState({ expanded: false });
    }
  }

  _addListeners() {
    const ref = firebase.database().ref('events/' + this.props.eventId + '/attendees');
    ref.on('value', data => {
      const attendees = data.val() || [];
      this.setState({ attendees: attendees });
    });
  }

  render() {
    const event = this.props.info;
    const attendees = this.state.attendees;
    return (
      <View style={styles.eventContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle}>
            {event.title.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={this.props.toggleFavorite}>
            <Image 
              source={attendees.includes(Firebase.getAuthenticatedUser().uid) ?
                require('../assets/images/saved_icon_active.png') :
                require('../assets/images/saved_icon.png')
              }
              style={styles.favoriteImageStyle}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.eventTime}>
          {event.time.toUpperCase() + ', ' + event.day.toUpperCase()}
        </Text>
        <Text style={styles.eventLocation}>
          {event.location}
        </Text>
        <Text style={styles.eventDescription}>
          {event.description}
        </Text>
        {attendees.length !== 0 && 
          <Text style={styles.interestedBoaters}>
            {attendees.length} Boater{attendees.length == 1 ? '' : 's'} Interested!
          </Text>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  eventContainer: {
    padding: 10,
  },
  interestedBoaters: {
    color: Colors.tabIconSelected,
    fontFamily: 'Lato-Bold',
    fontSize: 12
  },
  favoriteImageStyle: {
    width: 16,
    height: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventTitle: {
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  eventTime: {
    color: Colors.tabIconDefault,
    fontFamily: 'Lato-Bold',
    fontSize: 12,
  },
  eventLocation: {
    fontSize: 11,
    marginTop: 5,
    marginBottom: 5,
    color: Colors.tabIconDefault,
  },
  eventDescription: {
    fontSize: 11,
    color: Colors.tabIconDefault,
    marginBottom: 5,
  },
});

export default EventListing;