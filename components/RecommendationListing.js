import React from 'react';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  Linking,
} from 'react-native';

import Colors from '../constants/Colors';
import Firebase from '../util/Firebase';
import Hr from '../components/Hr';
import { ImageWithPlaceholder } from '../util/Images';

import * as firebase from 'firebase';
import ImageLoad from 'react-native-image-placeholder';

class RecommendationListing extends React.Component {
  state = {
    favorited: [],
  }

  // Opens the given url in the device's native browser
  _handlePress = (url) => {
    Linking.openURL('http://' + url);
  }

  // get updates on which users have favorited this recommenation
  _addEventListeners() {
    // const url = 'recommendations/' + this.props.recommendationId + '/favorited';
    // const ref = firebase.database().ref(url);
    // ref.on('value', data => {
    //   const favorited = data.val() || [];
    //   this.setState({ favorited: favorited });
    // });
  }

  render() {
    const recommendation = this.props.info;
    const { favorited, imageLoaded } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <ImageLoad
            style={styles.image}
            source={{uri: recommendation.imageURL}}
            loadingStyle={{ size: 'large', color: Colors.woodyBlue }}
          />
        </View>
        <View style={styles.listingContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              { recommendation.title.toUpperCase() }
            </Text>
            <TouchableOpacity onPress={this.props.toggleFavorite}>
              {this.props.favoritedImage}
            </TouchableOpacity>
          </View>
          <View style={styles.recommendedTextContainer}>
            <Text style={styles.category}>
              {recommendation.category + (recommendation.recommended ? ' - ' : ' ')}
            </Text>
            { recommendation.recommended && 
              <Text style={[styles.category, { color: Colors.woodyBlue, marginBottom: 0 }]}>
                Recommended
              </Text>
            }
          </View>
          { recommendation.distance && 
            <Text style={[styles.address, { color: Colors.tabIconSelected }]}>
              {`${parseInt(recommendation.distance)} mi`}
            </Text>
          }
          { recommendation.address && 
            <Text style={styles.address}>
              {recommendation.address}
            </Text>
          }
          { !recommendation.address &&
            <View style={styles.spacer}/>
          }
          <Text style={styles.description}>
            { recommendation.description }
          </Text>
          { recommendation.website &&
            <Text 
              style={styles.hyperlink} 
              onPress={() => this._handlePress(recommendation.website)}>
              {recommendation.website}
            </Text>
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flexDirection: 'row',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  recommendedTextContainer: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'contain',
  },
  listingContainer: {
    paddingLeft: 8,
    flex: 1,
    flexDirection: 'column',
  },
  favoriteImageStyle: {
    width: 16,
    height: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 13,
  },
  category: {
    color: Colors.tabIconDefault,
    fontFamily: 'Lato-Bold',
    fontSize: 12,
  },
  address: {
    fontSize: 11,
    marginTop: 5,
    marginBottom: 5,
    color: Colors.tabIconDefault,
  },
  description: {
    fontSize: 11,
    color: Colors.tabIconDefault,
    marginBottom: 5,
  },
  hyperlink: {
    color: Colors.tabIconSelected,
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  spacer: {
    padding: 5,
  },
});

export default RecommendationListing;