import React from 'react';

import {
  View,
  Text,
  StyleSheet
} from 'react-native';

class Hr extends React.Component {
  render() {
    return (
      <View>
        { this.props.text && 
          <View style={this.props.wrapperStyle}>
            <View style={this.props.lineStyle}/>
            <Text style={this.props.textStyle}>
             {this.props.text}
            </Text>
            <View style={this.props.lineStyle}/>
          </View>
        }
        { !this.props.text && 
          <View style={this.props.wrapperStyle}>
            <View style={this.props.lineStyle}/>
          </View>
        }
      </View>
    );
  }
}

export default Hr;
