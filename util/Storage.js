import { AsyncStorage, } from 'react-native';

import { RNS3 } from 'react-native-aws3';

const s3Options = {
  keyPrefix: 'uploads/',
  bucket: 'woodyboater-app-dev',
  region: 'us-east-1',
  accessKey: 'AKIAJEXLTN745VT4CZSA', // redacted
  secretKey: '/YXUFD++EjO0SrANzEbrPKnRduaY8y53EDqskXkQ', // redacted
  successActionStatus: 201,
};

class Storage {
  // Load the facebook auth token from local storage
  static async getFacebookToken() {
    try {
      const tokenString = await AsyncStorage.getItem('@Auth:FacebookToken');
      // Verify that we actually got something from the store
      if (tokenString === null) {
        return { token: '', expires: 0 };
      }
      return JSON.parse(tokenString);
    }
    catch (error) {
      return { token: '', expires: 0 };
    }
  }

  /**
   * @param token Should have the form { token: String, expires: String }
   */
  static async setFacebookToken(tokenString) {
    try {
      await AsyncStorage.setItem('@Auth:FacebookToken', tokenString);
    }
    catch (error) {
      console.log('Error setting token in AsyncStorage');
      console.log(error);
    }
  }

  static async putImage(file) {
    let imageUri = null;
    await RNS3.put(file, s3Options).then(response => {
      if (response.status !== 201) {
        console.log('Failed to upload image to s3');
        console.log(response);
        throw new Error('Failed to upload image to s3');
      }
      else {
        imageUri = response.body.postResponse.location;
      }
    });
    return imageUri;
  }

}

export default Storage;
