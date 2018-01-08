import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';

import { ImageWithPlaceholder } from '../util/Images';

import Expo, { MapView } from 'expo';
import Carousel, { Pagination } from 'react-native-snap-carousel';

import Colors from '../constants/Colors';

import Firebase from '../util/Firebase';

const { width, height } = Dimensions.get('window');
const calloutWidth = width - 20;
const imageCarouselWidth = calloutWidth - 10;

class ImageCarousel extends React.Component {
  state = {
    activeSlide: 0,
  }

  render() {
    if (!this.props.boats) {
      return <View/>;
    }
    const boatObjs = this.props.boats;
    const boats = Object.keys(boatObjs).map(key => boatObjs[key]);
    const slides = boats.map((boat, index) => {
      return (
        <Image
          key={`entry-${index}`}
          source={{uri: boat.imageURL}}
          style={styles.image}
        />
      );
    });

    const { activeSlide } = this.state;

    return (
      <View style={styles.imageContainer}>
        <Carousel
          ref={carousel => this._carousel = carousel}
          sliderWidth={imageCarouselWidth}
          itemWidth={imageCarouselWidth}
          slideStyle={styles.imageContainer}
          onSnapToItem={index => this.setState({ activeSlide: index })}
          enableMomentum={false}
          decelerationRate="fast"
          animationOptions={{ duration: 200, }}>
          {slides}
        </Carousel>
        <Pagination
          dotsLength={boats.length}
          activeDotIndex={activeSlide}
          containerStyle={styles.paginationContainer}
        />
      </View>
    );
  }
}

class Callout extends React.Component {
  state = {
    marginBottom: new Animated.Value(0),
    underlayActive: false,
    chatButtonPressed: false,
  }

  // rolls the bounce animation when the callout is opened
  componentDidMount() {
    const boats = this.props.info.boats;
    const numBoats = boats ? Object.keys(boats).length : 0;
    Animated.timing(
      this.state.marginBottom,
      {
        toValue: numBoats > 0 ? 150 : 10,
        duration: 500,
        easing: Easing.bounce,
      }
    ).start();
  }

  componentWillUnmount() {
    this.setState({ 
      marginBottom: new Animated.Value(0),
      underlayActive: false,
      chatButtonPressed: false,
    });
  }

  _toggleUnderlayActive(active) {
    this.setState({ underlayActive: active });
  }

  render() {
    const { marginBottom, underlayActive } = this.state;
    const { chatButtonPressed, info } = this.props;
    return (
      <Animated.View style={[{marginBottom}, styles.container, styles.customView]}>
        <ImageCarousel 
          boats={info.boats}
        />
        <Text style={styles.header}>
          {this.props.title.toUpperCase()}
        </Text>
        { info.location_city_state && 
          <Text style={styles.subheader}>
            {this.props.info.location_city_state}
          </Text>
        }
        { info.bio &&
          <Text style={styles.description}>
            {this.props.description}
          </Text>
        } 
        { info.id !== Firebase.getAuthenticatedUser().uid &&
          <TouchableHighlight 
            style={styles.chatButton}
            onPress={async () => {
              this.setState({ chatButtonPressed: true });
              this.props.chatButtonPress();
            }}
            underlayColor={Colors.tabIconSelected}
            onShowUnderlay={() => this._toggleUnderlayActive(true)}
            onHideUnderlay={() => this._toggleUnderlayActive(false)}>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Text style={[styles.chatButtonText, underlayActive ? styles.chatButtonTextActive : {}]}>
                CHAT
              </Text>
              { chatButtonPressed &&
                <ActivityIndicator
                  color={underlayActive ? '#fff' : Colors.tabIconSelected}
                  style={styles.activityIndicator}
                />
              }
            </View>
          </TouchableHighlight>
        }
        {/* info.contact && 
          <View style={styles.infoContainer}>
            <Text style={styles.info}>
              {info.contact.email}
            </Text>
            <Text style={styles.info}>
              {info.contact.phone}
            </Text>
          </View>
        */}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignSelf: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: height * .3 - 5,
    width: imageCarouselWidth,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 20,
  },
  header: {
    fontFamily: 'Lato-Bold',
    fontSize: 16,
    paddingTop: 5,
  },
  subheader: {
    fontFamily: 'Lato-Bold',
    fontSize: 12,
    color: Colors.tabIconDefault,
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    padding: 5,
    color: '#3d3d3d',
  },
  chatButtonText: {
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 12,
    color: Colors.tabIconDefault,
    textAlign: 'center',
  },
  chatButtonTextActive: {
    color: '#fff',
  },
  chatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.inactiveBackground,
    paddingVertical: 10,
    alignItems: 'center',
    height: 44,
    width: calloutWidth * .75,
    marginVertical: 5,
    borderRadius: 5,
  },  
  customView: {
    width: calloutWidth,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
  },
  paginationContainer: { 
    paddingVertical: 5, 
    backgroundColor: 'rgba(0,0,0,0.0)' 
  },
  activityIndicator: {
    paddingHorizontal: 20,
  }
});

export default Callout;