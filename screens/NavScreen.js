import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

import SampleText from '../SampleText';

const NavScreen = ({ navigation, banner }) => (
  <View style={styles.container}>
    <SampleText>{banner}</SampleText>
    <Text>Hello! Welcome to the WoodyBoater app!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 20 : 0,
    // flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NavScreen;
