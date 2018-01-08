/* @flow */

import React from 'react';
import { 
  View, 
  Dimensions, 
  Text, 
  StyleSheet,
  Vibration,
} from 'react-native';
import Expo, { Font, Location, Permissions, Notifications } from 'expo';
import { StackNavigator, NavigationActions } from 'react-navigation';

import LoginScreen from './screens/LoginScreen';
import NavBar from './navigation/NavBar';
import RegistrationScreen from './screens/RegistrationScreen';
import AddBoatScreen from './screens/AddBoatScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import CreateRecommendationScreen from './screens/CreateRecommendationScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import ChatSettingsScreen from './screens/ChatSettingsScreen';

import Chat from './components/Chat';
import Colors from './constants/Colors';
import MessageNotification from './components/MessageNotification';

import * as firebase from 'firebase';

import { cacheImages, cacheFonts } from './util/CacheHelpers';
const { width, height } = Dimensions.get('screen');

console.ignoredYellowBox = [
  'Setting a timer'
];

const config = {
  apiKey: 'AIzaSyC6KymSLKg4w4Snrs8wuC4y5pNWhf-4RBk',
  authDomain: 'woodyboater-dev.firebaseapp.com',
  databaseURL: 'https://woodyboater-dev.firebaseio.com',
  projectId: 'woodyboater-dev',
  storageBucket: 'woodyboater-dev.appspot.com',
  messagingSenderId: '1062071362852'
};

firebase.initializeApp(config);

import Firebase from './util/Firebase';

class App extends React.Component {
  state = {
    assetsReady: false,
    authStateDetermined: false,
    appNavigator: null,
    notification: null,
    navigateToChatOnReady: false,
  }

  _createAppNavigator(initialRouteName, params) {
    return StackNavigator({
      Login: {
        screen: LoginScreen,
        path: 'login',
      },
      Registration: {
        screen: RegistrationScreen,
        path: 'registration',
      },
      Home: {
        screen: NavBar,
        path: 'home',
      },
      AddBoatScreen: {
        screen: AddBoatScreen,
        path: 'addBoat',
      },
      CreateEventScreen: {
        screen: CreateEventScreen,
        path: 'createEvent',
      },
      CreateRecommendationScreen: {
        screen: CreateRecommendationScreen,
        path: 'createRecommendation',
      },
      ProfileSettingsScreen: {
        screen: ProfileSettingsScreen,
        path: 'profileSettings',
      },
      ChatView: {
        screen: Chat,
        path: 'chat',
      },
      ChatSettingsScreen: {
        screen: ChatSettingsScreen,
        path: 'chatSettings',
      },
    }, {
      initialRouteName: initialRouteName,
      initialRouteParams: params,
      cardStyle: {
        backgroundColor: '#fff',
      },
    });
  }

  async componentDidMount() {
    // invoking authObserver() removes the onAuthStateChanged observer

    const authObserver = firebase.auth().onAuthStateChanged(async user => {
      let initialRouteName = 'Login';
      let initialRouteParams = {};
      if (user !== null) {
        const userInfo = await Firebase.getCurrentUser();
        global.userInfo = userInfo;
        // check if the user has completed the registration flow
        // (not just signed up)
        if (await Firebase.userNotRegistered(user.uid)) {
          initialRouteName = 'Registration';
          initialRouteParams = { name: user.displayName };
        }
        // check if user opened the app from a push notification
        else if (this.state.navigateToChatOnReady) {
          const { chatId, chatInfo } = this.state.notification.data;
          initialRouteName = 'Home';
          initialRouteParams = { 
            navigateToChat: true,
            chatParams: {
              id: chatId,
              info: chatInfo,
              userInfo: userInfo,
            }
          };
        }
        // User is registered, send them to the main screen
        else {
          initialRouteName = 'Home';
          initialRouteParams = { 
            name: user.displayName,
            userInfo: userInfo
          };
          await this._checkForPushToken();
          this._notificationSubscription = Notifications.addListener(this._handleNotification);
        }
      }
      // navigate to the determined initial screen (default is Login)
      this.setState({
        appNavigator: this._createAppNavigator(
          initialRouteName, 
          initialRouteParams
        )
      });
      authObserver();
    });
    await this._loadAssetsAsync();
  }

  async _checkForPushToken() {
    const userInfo = await Firebase.getCurrentUser();
    if (!userInfo.expoPushToken) {
      // ask permission to send push notifications
      const { existingStatus } = await Permissions.getAsync(Permissions.REMOTE_NOTIFICATIONS);
      let finalStatus = existingStatus;

      // only ask for permissions if they have not already been determined
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.REMOTE_NOTIFICATIONS);
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }
      
      Firebase.createExpoPushToken();
    }
  }


  _handleNotification = (notification) => {
    if (this.state.appNavigator === null) {
      this.setState({
        navigateToChatOnReady: true,
        notification: notification,
      });
      return;
    }

    this.setState({ notification: notification });

    const info = notification.data.chatInfo;
    const chatId = notification.data.chatId;

    const { route, params } = this._getCurrentRouteInfo();
    // don't show notification while in the chat it originated from
    if (route === 'ChatView' && params && params.id === chatId) {
      return;
    }

    if (notification.origin === 'selected') {
      this._onNotificationPress();
      return;      
    }

    Vibration.vibrate([0]);
    this._notification.show(info, 10000);
  }

  _getCurrentRouteInfo() {
    const nav = this.navigator.state.nav;
    const routeIndex = nav.index;
    const currentRoute = nav.routes[routeIndex];

    const route = currentRoute.routeName;
    const params = currentRoute.params;
    return { route: route, params: params };
  }

  _onNotificationPress = () => {
    const { notification } = this.state;
    const info = notification.data.chatInfo;
    const id = notification.data.chatId;

    const navigateToChat = NavigationActions.navigate({
      routeName: 'ChatView',
      params: {
        id: id,
        info: info,
      },
    });

    this.navigator.dispatch(navigateToChat);
  };

  render() {
    if ( !(this.state.assetsReady && this.state.appNavigator !== null) ) {
      return <Expo.AppLoading />;
    }

    const AppNavigator = this.state.appNavigator;
    return (
      <View style={styles.container}>
        <AppNavigator ref={nav => { this.navigator = nav; }}/>
        <MessageNotification
          onPress={() => this._onNotificationPress()}
          ref={msgNotification => { this._notification = msgNotification; }}
        />
      </View>
    );
  }

  _loadAssetsAsync = async () => {
    const imageAssets = cacheImages([
      require('./assets/images/community_icon.png'),
      require('./assets/images/community_icon_active.png'),
      require('./assets/images/profile_icon.png'),
      require('./assets/images/profile_icon_active.png'),
      require('./assets/images/recommended_icon.png'),
      require('./assets/images/recommended_icon_active.png'),
      require('./assets/images/saved_icon.png'),
      require('./assets/images/saved_icon_active.png'),
      require('./assets/images/explore_icon.png'),
      require('./assets/images/explore_icon_active.png'),
      require('./assets/images/map_icon.png'),
      require('./assets/images/map_icon_active.png'),

      require('./assets/images/Login_Background.png'),
      require('./assets/images/woody_mark.png'),
      require('./assets/images/user_marker.png'),
      require('./assets/images/blank_pixel.png'),
      require('./assets/images/X.png'),
      require('./assets/images/woody_badge.png'),

      require('./assets/images/lodging_red.png'),
      require('./assets/images/lodging_grey.png'),
      require('./assets/images/lodging_blue.png'),

      require('./assets/images/boating_red.png'),
      require('./assets/images/boating_grey.png'),
      require('./assets/images/boating_blue.png'),
      
      require('./assets/images/food_blue.png'),
      require('./assets/images/food_red.png'),
      require('./assets/images/food_grey.png'),
      
      require('./assets/images/notification_icon.png'),
    ]);

    await Font.loadAsync({
      'CarterSansPro-Bold': require('./assets/fonts/CarterSansPro-Bold.ttf'),
      'Lato-Bold': require('./assets/fonts/Lato-Bold.ttf'),
    });

    await Promise.all([
      ...imageAssets,
    ]);

    this.setState({ assetsReady: true, });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
