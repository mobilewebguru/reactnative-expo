
import React from 'react';

import {
  TextInput,
  View,
  Dimensions,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';

import { Hideo } from 'react-native-textinput-effects';

// TODO: search icon + animation
class SearchBar extends React.Component {
  render() {
    return (
      <View style={this.props.containerStyle}>
        <TextInput 
          {...this.props}
          style={this.props.textStyle}
          placeholder={this.props.placeholder}
          placeholderTextColor={Colors.tabIconDefault}
          onChangeText={text => this.props.onChangeText(text)}
          value={this.props.value}
          underlineColorAndroid="transparent"
          onSubmitEditing={this.props.onSubmitEditing}
          returnKeyType="search"
        />
      </View>
    );
  }
}

export default SearchBar;