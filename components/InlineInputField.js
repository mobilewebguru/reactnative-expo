import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

import Colors from '../constants/Colors';

class InlineInputField extends React.Component {
  render() {
    return (
      <View style={styles.inputFieldContainer}>
        <Text style={styles.inputFieldLabel}>
          {this.props.label}
        </Text>
        <View style={styles.inputField}>
          <TextInput
            {...this.props}
            style={styles.inputFieldText}
            value={this.props.value}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  inputFieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputFieldLabel: {
    fontFamily: 'Lato-Bold',
    color: Colors.tabIconDefault,
    fontSize: 11,
  },
  inputField: {
    backgroundColor: Colors.inactiveBackground,
    marginBottom: 7,
    paddingVertical: 8,
    paddingHorizontal: 30,
    width: 200,
  },
  inputFieldText: {
    textAlign: 'center',
    color: 'black',
    fontSize: 12,
    height: 15,
  },
});

export default InlineInputField;