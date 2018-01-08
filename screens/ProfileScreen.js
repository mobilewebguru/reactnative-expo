import React from 'react';
import { 
  Button, 
  StyleSheet, 
  Platform,
  View,
  Text,
  TextInput,
  Modal,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';

import Expo from 'expo';
import { Ionicons } from '@expo/vector-icons';

import Images from '../util/Images';
import InlineInputField from '../components/InlineInputField';
import MultilineInputField from '../components/MultilineInputField';
import InlineToggle from '../components/InlineToggle';
import BoatCarousel from '../components/BoatCarousel';

import Colors from '../constants/Colors';
import DefaultNavOptions from '../constants/DefaultNavigationOptions';

import * as firebase from 'firebase';
import Firebase from '../util/Firebase';
import Storage from '../util/Storage';

class ProfileScreen extends React.Component {
  static NavigationOptions = DefaultNavOptions;

  _renderBoats() {
    return (
      <BoatCarousel 
        userId={Firebase.getAuthenticatedUser().uid}
        onAddBoatButtonPress={() => {
          console.log('Navigate to AddBoatScreen?');
          this.props.navigation.navigate('AddBoatScreen');
        }}
      />
    );
  }

  render() {
    const { params } = this.props.navigation.state;
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.headerContainer}>
            <Text style={[styles.header, styles.pageHeader]}>
              {params && params.name ? params.name.toUpperCase() : 'PROFILE'}
            </Text>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('ProfileSettingsScreen')}>
              <Ionicons 
                name="ios-settings-outline" 
                size={32} 
                color={Colors.tabIconDefault} 
                style={styles.settingsIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.header, styles.sectionHeader]}>
            YOUR BOATS
          </Text>
          {this._renderBoats()}
          <Text style={[styles.header, styles.sectionHeader, { marginTop: 15 }]}>
            SAVED
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',    
  },
  settingsIcon: { 
    padding: 10 
  },
  pageHeader: {
    fontSize: 18,
    padding: 10,
  },
  sectionHeader: {
    fontSize: 12,
    paddingHorizontal: 15,
  },
});

export default ProfileScreen;
