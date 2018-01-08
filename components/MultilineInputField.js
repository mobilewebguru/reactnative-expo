import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';

import Colors from '../constants/Colors';
const { width, height } = Dimensions.get('window');

class MultilineInputField extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {this.props.label}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            {...this.props}
            style={styles.text}
            value={this.props.value}
            onChangeText={(text) => {
              this.props.onChange(text);
            }}
            multiline={true}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Lato-Bold',
    color: Colors.tabIconDefault,
    fontSize: 11,
    marginBottom: 5,
  },
  inputContainer: {
    backgroundColor: Colors.inactiveBackground,
    marginBottom: 7,
    width: width - 30,
  },
  text: {
    color: 'black',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    height: 100,
  },
});

export default MultilineInputField;