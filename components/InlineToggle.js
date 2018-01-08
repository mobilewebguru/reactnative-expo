import React from 'react';

import {
  View,
  Text,
  Switch,
  StyleSheet,
} from 'react-native';

import Colors from '../constants/Colors';

class InlineToggle extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {this.props.label}
        </Text>
        <Switch 
          onTintColor={Colors.tabIconSelected}
          onValueChange={() => this.props.onChange()}
          value={this.props.value}
          thumbTintColor="#f5f5f5"
          tintColor="#ddd"
        />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  label: {
    fontFamily: 'Lato-Bold',
    color: Colors.tabIconDefault,
    fontSize: 11,
  },
});

export default InlineToggle;