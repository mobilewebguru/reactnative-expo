import Geocoder from 'react-native-geocoding';

class LocationServices {
  constructor() {
    Geocoder.setApiKey('AIzaSyBpWhmQmx1cXVJq9Oihx19rTJ9yfRAt9po');
  }

  getFromLocation(location) {
    let result = null;
    Geocoder.getFromLocation(location).then(
      json => {
        result = json.results[0].geometry.location;
      },
      error => {
        console.log(error);
      }
    );
    return result;
  }

  getFromLatLng(latLng) {
    let result = null;
    Geocoder.getFromLatLng(latLng).then(
      json => {
        result = json.results[0];
      },
      error => {
        console.log(error);
      },
    );
    return result;
  }

}

export default LocationServices;