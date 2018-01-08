import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableHighlight,
 } from 'react-native';

import Expo from 'expo';
import SearchBar from '../components/SearchBar';
import Toast from 'react-native-easy-toast';

import MapView from '../components/Map';

import Colors from '../constants/Colors';
import DefaultNavOptions from '../constants/DefaultNavigationOptions';
import Firebase from '../util/Firebase';

class ExploreScreen extends React.Component {
  async componentDidMount() {
    const { params } = this.props.navigation.state;
    if (params && params.name) {
      this.refs.toast.show('Welcome ' + params.name + '!', 3000);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar
          hidden={true}
        />
        <MapView navigation={this.props.navigation}/>
        <Toast ref="toast" position="bottom"/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
  },
});

export default ExploreScreen;
