import React from 'react';

import { 
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';

import {
  createNavigator,
  createNavigationContainer,
  TabRouter,
  addNavigationHelpers,
} from 'react-navigation';

import Expo from 'expo';

import Colors from '../constants/Colors';

import EventsScreen from './EventsScreen';
import CreateEventScreen from './CreateEventScreen';
import ChatScreen from './ChatScreen';


class CommunityScreenTabBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeTab: 'Chat' };
  }

  render() {
    const navigation = this.props.navigation;
    const { routes } = navigation.state;
    const TabBar = this;
    const activeTab = TabBar.state.activeTab;
    return (
      <View style={styles.tabContainer}>
        {routes.map(route => {
          const isActive = activeTab === route.routeName;
          return (
            <TouchableOpacity
              onPress={() => {
                TabBar.state.activeTab = route.routeName;
                navigation.navigate(route.routeName);
              }}
              style={[styles.inactiveTab, isActive && styles.activeTab]}
              key={route.routeName}>
                <Text style={[styles.inactiveText, isActive && styles.activeText]}>
                  {route.routeName.toUpperCase()}
                </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }
}


const CommunityScreenView = ({ router, navigation }) => {
  const { routes, index } = navigation.state;
  const ActiveScreen = router.getComponentForState(navigation.state);
  return (
    <View style={styles.container}>
      <Text style={[styles.header, styles.pageHeader]}>
        COMMUNITY
      </Text>
      <CommunityScreenTabBar navigation={navigation}/>
      <ActiveScreen
        navigation={addNavigationHelpers({
          ...navigation,
          state: routes[index],
        })}
      />
    </View>
  );
};


const CommunityScreenRouter = TabRouter(
  {
    Chat: {
      screen: ChatScreen,
      path: 'chatScreen',
    },
    Events: {
      screen: EventsScreen,
      path: 'events',
    },
  },
  {
    initialRouteName: 'Chat',
  }
);


const CommunityScreenTabs = createNavigationContainer(
  createNavigator(CommunityScreenRouter)(CommunityScreenView)
);

const styles = StyleSheet.create({
  header: {
    marginVertical: 10,
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',
  },
  pageHeader: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 50,
    margin: 5
  },
  activeTab: {
    backgroundColor: Colors.tabIconSelected,
    marginHorizontal: 5,
  },
  inactiveTab: {
    flex: 1,
    alignContent: 'center',
    marginVertical: 5,
    justifyContent: 'center',
    backgroundColor: Colors.inactiveBackground,
    marginHorizontal: 5,
  },
  activeText: {
    color: '#fff',
  },
  inactiveText: {
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 12,
    color: Colors.tabIconDefault,
    textAlign: 'center',
  },
});

export default CommunityScreenTabs;
