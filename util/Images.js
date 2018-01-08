import React, { Component } from 'react';

import {
  Image,
  View,
  StyleSheet,
} from 'react-native';

const Images = {
  explore: {
    inactive: require('../assets/images/explore_icon.png'),
    active: require('../assets/images/explore_icon_active.png')
  },
  saved: {
    inactive: require('../assets/images/saved_icon.png'),
    active: require('../assets/images/saved_icon_active.png')
  },
  recommended: {
    inactive: require('../assets/images/recommended_icon.png'),
    active: require('../assets/images/recommended_icon_active.png')
  },
  community: {
    inactive: require('../assets/images/community_icon.png'),
    active: require('../assets/images/community_icon_active.png')
  },
  profile: {
    inactive: require('../assets/images/profile_icon.png'),
    active: require('../assets/images/profile_icon_active.png')
  },
  map: {
    inactive: require('../assets/images/map_icon.png'),
    active: require('../assets/images/map_icon_active.png')    
  },
};

/**
 * Renders a placeholder image while the given image is loaded asynchronously
 * over the network, then renders that image when it's been loaded
 *
 * Props:
    source: {string} required
    placeholderSource: {string} required, the source for the locally cached 
      placeholder image given by e.g. require('images/placeholder.png')
    style: {style} required, the style for the image and the placeholder,
      must contain an explicit width and height
 */
class ImageWithPlaceholder extends Component {
  state = {
    imageLoaded: false,
  }

  componentWillMount() {
    const { source } = this.props;
    Image.prefetch(source).then(() => this.setState({ imageLoaded: true }));
  }

  render() {
    const { imageLoaded } = this.state;
    const { width, height } = this.props;
    if (!imageLoaded) {
      return (
        <View 
          style={{
            width: width,
            height: height,
            backgroundColor: '#CCC',
            borderRadius: width * .5,
          }}
        />
      );
    }
    return (
      <Image
        source={{uri: this.props.source}}
        style={this.props.style}
      />
    );
  }
}

export { ImageWithPlaceholder };
export default Images;