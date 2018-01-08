import React from 'react';
import { 
  View,
  StyleSheet,
  Text,
  WebView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import Expo, { Permissions, Notifications } from 'expo';

import * as firebase from 'firebase';

import Images from '../util/Images';
import NavScreen from './NavScreen';
import Firebase from '../util/Firebase';


const WEBVIEW_REF = 'webview';

const BGWASH = 'rgba(255,255,255,0.8)';
const DISABLED_WASH = 'rgba(255,255,255,0.25)';

class BlogScreen extends React.Component {
  state = {
    backButtonEnabled: false,
    forwardButtonEnabled: false,
    status: '',
  };

  async componentWillMount() {
    const authObserver = firebase.auth().onAuthStateChanged(async user => {
      if (!user) {
        return;
      }

      const userInfo = await Firebase.getCurrentUser();
      // check if the user already has a token
      if (userInfo.expoPushToken) { 
        return;
      }

      // otherwise, get a new token

      const { existingStatus } = await Permissions.getAsync(Permissions.REMOTE_NOTIFICATIONS);
      let finalStatus = existingStatus;

      // only ask if permissions have not already been determined, because
      // iOS won't necessarily prompt the user a second time.
      if (existingStatus !== 'granted') {
        // Android remote notification permissions are granted during the app
        // install, so this will only ask on iOS
        const { status } = await Permissions.askAsync(Permissions.REMOTE_NOTIFICATIONS);
        finalStatus = status;
      }

      // Stop here if the user did not grant permissions
      if (finalStatus !== 'granted') {
        return;
      }

      // Get the token that uniquely identifies this device
      let token = await Notifications.getExponentPushTokenAsync();

      const tokenRef = firebase.database().ref(`users/${user.uid}/expoPushToken`);
      await tokenRef.set(token);
    });
  }

  // handles "< Back" press 
  goBack = () => {
    this.refs[WEBVIEW_REF].goBack();
  }

  // handles "Forward >" press
  goForward = () => {
    this.refs[WEBVIEW_REF].goForward();
  }

  // Updates the status bar when browser state changes
  onNavigationStateChange = (navState) => {
    const title = navState.title;
    const status = title.length > 30 ? title.substring(0, 30) + '...' : title;
    this.setState({
      backButtonEnabled: navState.canGoBack,
      forwardButtonEnabled: navState.canGoForward,
      status: status,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true}/>
        {/*<View style={styles.addressBarRow}>
          <TouchableOpacity
            onPress={this.goBack}
            style={
              this.state.backButtonEnabled ? 
                styles.navButton : 
                styles.disabledButton
            }>
            <Text style={
              this.state.backButtonEnabled ? 
                styles.navText : 
                styles.disabledText
              }>
              {'< Back'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.statusBarText}>{this.state.status}</Text>
          <TouchableOpacity
            onPress={this.goForward}
            style={this.state.forwardButtonEnabled ? styles.navButton : styles.disabledButton}>
            <Text style={this.state.forwardButtonEnabled ? styles.navText : styles.disabledText}>
              {'Forward >'}
            </Text>
          </TouchableOpacity>
        </View>*/}
        <WebView 
          ref={WEBVIEW_REF}
          source={{ uri: 'http://www.woodyboater.com' }}
          onNavigationStateChange={this.onNavigationStateChange}
          style={styles.container}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // navButton: {
  //   padding: 3,
  //   marginRight: 3,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   backgroundColor: BGWASH,
  //   borderColor: 'transparent',
  //   borderRadius: 3,
  // },
  // navText: {
  //   color: '#639fff'
  // },
  // disabledButton: {
  //   padding: 3,
  //   marginRight: 3,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   backgroundColor: DISABLED_WASH,
  //   borderColor: 'transparent',
  //   borderRadius: 3,
  // },
  // disabledText: {
  //   color: '#888',
  // },
  // addressBarRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   padding: 8,
  // },
  // statusBarText: {
  //   fontSize: 10,
  // },
});

export default BlogScreen;
