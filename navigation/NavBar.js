import React from 'react';
import Expo, { Permissions, Notifications } from 'expo';

import { 
  StyleSheet, 
  Image, 
  Dimensions,
  View,
} from 'react-native';

import { TabNavigator, TabBarBottom } from 'react-navigation';

import ExploreScreen from '../screens/ExploreScreen';
import RecommendedScreen from '../screens/RecommendedScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BlogScreen from '../screens/BlogScreen';
import EventsScreen from '../screens/EventsScreen';

import MessageNotification from '../components/MessageNotification';

import Colors from '../constants/Colors';
import DefaultNavOptions from '../constants/DefaultNavigationOptions';
import Images from '../util/Images';
const { width, height } = Dimensions.get('screen');

/*
---
DEVICE DIMENSIONS
---

iPhone: 
  7: 375x667
  6: 375x667
  5: 320x568

Android:
  TODO
*/

ExploreScreen.navigationOptions = {
  tabBarLabel: 'EXPLORE',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.map.active : Images.map.inactive}
      style={styles.image}
    />
  ),
};

RecommendedScreen.navigationOptions = {
  tabBarLabel: 'RECOMMENDED',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.saved.active : Images.saved.inactive}
      style={styles.image}
    />
  ),
};

BlogScreen.navigationOptions = {
  tabBarLabel: 'NEWS',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.recommended.active : Images.recommended.inactive}
      style={styles.image}
    />
  ),
};

// CommunityScreen
EventsScreen.navigationOptions = {
  tabBarLabel: 'COMMUNITY',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.community.active : Images.community.inactive}
      style={styles.image}
    />
  ),
};

CommunityScreen.navigationOptions = {
  tabBarLabel: 'COMMUNITY',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.community.active : Images.community.inactive}
      style={styles.image}
    />
  ),
};

ProfileScreen.navigationOptions = {
  tabBarLabel: 'PROFILE',
  tabBarIcon: ({ tintColor, focused }) => (
    <Image
      source={focused ? Images.profile.active : Images.profile.inactive}
      style={styles.image}
    />
  ),
};

const NavBar = TabNavigator(
  {
    Blog: {
      screen: BlogScreen,
      path: 'blog',
    },
    Explore: {
      screen: ExploreScreen,
      path: 'explore',
    },
    Recommended: {
      screen: RecommendedScreen,
      path: 'Recommended',
    },
    Community: {
      screen: CommunityScreen,
      path: 'community',
    },
    Profile: {
      screen: ProfileScreen,
      path: 'profile',
    },
  },
  {
    navigationOptions: DefaultNavOptions,
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    lazy: true,
    tabBarOptions: {
      // showLabel: width > 320 ? true : false,
      activeTintColor: Colors.tabIconSelected,
      labelStyle: {
        fontFamily: 'Lato-Bold',
        fontSize: width > 320 ? 9 : 8,
      },
      style: {
        backgroundColor: '#fff',
      },
    },
  }
);

const styles = StyleSheet.create({
  image: {
    width: 28,
    height: 28,
  },
});

export default NavBar;
