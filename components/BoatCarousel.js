import React from 'react';
import { 
  Button, 
  StyleSheet, 
  Platform,
  View,
  Text,
  TextInput,
  Modal,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import Colors from '../constants/Colors';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

const slideHeight = Math.round(viewportHeight * .4);
const slideWidth = Math.round(viewportWidth * .85);
const horizontalMargin = Math.round(viewportWidth * .01);

const sliderWidth = viewportWidth;
const itemWidth = slideWidth + horizontalMargin * 2;

const entryBorderRadius = 8;

import * as firebase from 'firebase';

class BoatCarousel extends React.Component {
  state = {
    boats: {},
  }

  componentWillMount() {
    this._addEventListeners();
  }

  _addEventListeners() {
    const { userId } = this.props;

    const boatsRef = firebase.database().ref('users/' + userId + '/boats');
    boatsRef.on('child_changed', data => this._onBoatUpdate(data));
    boatsRef.on('child_added', data => this._onBoatUpdate(data));
  }

  _onBoatUpdate(data) {
    const key = data.key;
    const boat = data.val();

    const { boats } = this.state;
    boats[key] = boat;
    this.setState({ boats: boats });
  }

  _renderPlaceholder() {
    return <View/>;
  }

  render() {
    let { boats } = this.state;
    if (!boats) {
      boats = {
        placeholder: {
          year: 'Uh oh, looks like you haven\'t added a boat yet!',
          description: 'Go ahead and add one with the "Add A Boat" button below!',
          imageURL: 'https://s3.amazonaws.com/woodyboater-app-dev/uploads/homealone.jpg',
        }
      };
    }
    const placeholderText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation';

    const boatArray = Object.keys(boats).map(key => boats[key]);
    const slides = boatArray.map((boat, index) => {
      const { year, make, model } = boat;
      const boatTitle = [year, make, model].filter(field => field !== undefined).reduce((title, field) => title + field + ' ', '');
      return (
        <View 
          style={styles.slideContainer}
          key={`boat-${index}`}>
          <View style={styles.imageContainer}>        
            <Image 
              source={{ uri: boat.imageURL }}
              style={styles.image}
            />
            <View style={styles.radiusMask}/>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.header}>
              {boatTitle}
            </Text>
            <Text style={styles.bodyText}>
              {boat.description || placeholderText}
            </Text>
          </View>
        </View>
      );
    });
    return (
      <View style={styles.container}>
        <Carousel
          ref={carousel => this._carousel = carousel}
          sliderWidth={sliderWidth}
          itemWidth={itemWidth}
          inactiveSlideScale={0.94}
          inactiveSlideOpacity={0.6}
          removeClippedSubviews={false}
          enableMomentum={false}>
          {slides}
        </Carousel>
        <TouchableOpacity onPress={() => this.props.onAddBoatButtonPress()}>
          <View style={styles.addBoatButton}>
            <Text style={styles.addBoatButtonText}>
              ADD A BOAT
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
  },
  slideContainer: {
    width: itemWidth,
    height: slideHeight,
    paddingLeft: horizontalMargin,
    paddingRight: horizontalMargin,
    paddingBottom: 18,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    borderRadius: Platform.OS === 'ios' ? entryBorderRadius : 0,
    borderTopLeftRadius: entryBorderRadius,
    borderTopRightRadius: entryBorderRadius,
  },
  textContainer: {
    justifyContent: 'center',
    paddingTop: 20 - entryBorderRadius,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderBottomLeftRadius: entryBorderRadius,
    borderBottomRightRadius: entryBorderRadius,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#eee',
    borderTopLeftRadius: entryBorderRadius,
    borderTopRightRadius: entryBorderRadius,
  },
  radiusMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: entryBorderRadius,
    backgroundColor: '#eee'
  },
  addBoatButton: {
    backgroundColor: Colors.tabIconSelected,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    alignSelf: 'center',
    width: 250,
  },
  addBoatButtonText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  header: {
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 14,
  },
  bodyText: {
    color: '#444',
    fontFamily: 'Lato-Bold',
    fontSize: 12,
  },
});

export default BoatCarousel;