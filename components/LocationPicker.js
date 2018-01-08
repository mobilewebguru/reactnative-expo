import React from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';

import Expo, { MapView, Location } from 'expo';

import Geocoder from 'react-native-geocoding';

class LocationPicker extends React.Component {
  _onPress(e) {
    const coordinate = e.nativeEvent.coordinate;
    this._map.animateToCoordinate(coordinate, 300);
    this.props.onChange(coordinate);
  }

  animateToRegion(region, duration = 300) {
    this._map.animateToRegion(region, duration);
  }

  render() {
    const { coordinate } = this.props;

    return (
      <MapView
        style={this.props.mapStyle}
        initialRegion={this.props.initialRegion}
        onPress={e => this._onPress(e)}
        ref={mapView => this._map = mapView}>
        {this.props.coordinate && 
          <MapView.Marker draggable
            coordinate={this.props.coordinate}
            onDragEnd={e => {
              this._onPress(e);
            }}
          />
        }
      </MapView>
    );
  }
}

export default LocationPicker;