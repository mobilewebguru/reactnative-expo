import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';

import Expo, { Facebook } from 'expo';
import FadeIn from '@expo/react-native-fade-in-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import Toast from 'react-native-easy-toast';

import Colors from '../constants/Colors';
import DefaultNavOptions from '../constants/DefaultNavigationOptions';
import Hr from '../components/Hr';

import Firebase from '../util/Firebase';
import * as firebase from 'firebase';
import Storage from '../util/Storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

class LoginField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }

  render() {
    return (
      <View style={styles.loginField}>
        <TextInput
          {...this.props}
          ref="TextInput"
          style={styles.loginFieldText}
          placeholderTextColor={Colors.tabIconDefault}
          onChangeText={(text) => {
            this.setState({text});
            this.props.onChange(text);
          }}
          value={this.state.text}
          autoCorrect={false}
          underlineColorAndroid="rgba(0,0,0,0.0)"
        />
      </View>
    );
  }
}

class LoginScreen extends React.Component {

  static navigationOptions = DefaultNavOptions;
  
  state = {
    inputValues: {},
    loggingInWithFacebook: false,
    loggingInWithEmail: false,
  }

  _forgotPassword = () => {
    if (this.state.inputValues.email) {
      const email = this.state.inputValues.email;
      firebase.auth().sendPasswordResetEmail(email).then(
        () => {
          this.refs.toast.show('An email with instructions for resetting your password has been sent to ' + email, 8000);
        },
        error => {
          console.log(error);
          this.refs.toast.show('Error: ' + error.message, 5000);
        }
      );
    }
    else {
      this.refs.toast.show('Enter your email above and press "Forgot Password" again', 5000);
    }
  };


  _onTextInput(field, text) {
    const state = this.state.inputValues;
    state[field] = text;
    this.setState({ inputValues: state });
  }

  _login() {
    const { email, password } = this.state.inputValues;
    const { navigation } = this.props;

    if (email == null || email === '' || password == null || password === '') {
      this.refs.toast.show('Email and password are both required', 5000);
      return;
    }

    this.setState({ loggingInWithEmail: true });

    Firebase.loginWithEmail(email, password).then(user => {
      navigation.navigate('Home', { name: user.displayName  });
    }).catch(error => {
      this._onLoginError(error);
    });
  }

  _onLoginError(error) {
    this.refs.toast.show('Error: ' + error.message, 5000);
    console.log(error);
    this.setState({ loggingInWithEmail: false });
  }

  _signUp = () => {
    this.props.navigation.navigate('Registration');
  }

  _signInWithFacebook = async () => {
    const token = await this._getFacebookToken();
    if (!token || token === '') {
      console.log('Error getting token in _signInWithFacebook');
      return;
    }

    const user = await this._signInWithFacebookFromToken(token);
    if (await Firebase.userNotRegistered(user.uid)) {
      this.props.navigation.navigate(
        'Registration', 
        { 
          name: user.displayName,
        }
      );
    }
    else {
      this.props.navigation.navigate(
        'Home', 
        {
          name: user.displayName,
        }
      );
    }
  }

  // Returns a valid facebook token
  _getFacebookToken = async () => {
    // const tokenData = await Storage.getFacebookToken();
    // let token = tokenData['token'];
    // const expires = tokenData['expires'];

    // // "expires" is the sec past epoch that the provided token expires
    // const currentTimeSinceEpoch = new Date() / 1000;
    // // get a new token if necessary
    // if (token == null || token === '' || expires < currentTimeSinceEpoch) { 
    //   token = await this._getNewFacebookToken();
    // }

    // return token;
    return await this._getNewFacebookToken();
  }

  // Attempts to authenticate the user with firebase if given a valid FB token
  async _signInWithFacebookFromToken(token) {
    const onError = (error) => {
      this.refs.toast.show(error.message, 5000);
      this.setState({ loggingInWithFacebook: false });
    };
    this.setState({ loggingInWithFacebook: true });
    return await Firebase.loginWithFacebook(token, onError);
  }

  // Prompts the user to sign into FB (used when there's no valid token)
  async _getNewFacebookToken() {
    const { type, token, expires } = await 
      Facebook.logInWithReadPermissionsAsync('1909170022693753', {
        permissions: ['public_profile'],
        behavior: Platform.OS === 'ios' ? 'web' : 'system', //Platform.OS === 'ios' ? 'web' :
      }
    );

    if (type === 'success') {
      await Storage.setFacebookToken(JSON.stringify({
        token: token,
        expires: expires,
      }));
      return token;
    }
    else {
      return '';
    }
  }

  _focusNextField(nextField) {
    this.refs[nextField].refs.TextInput.focus();
  }

  _renderInnerContents() {
    return (
      <ScrollView 
        contentContainerStyle={styles.loginFieldsContainer}
        showsVerticalScrollIndicator={false}>

        <Image
          source={require('../assets/images/woody_mark.png')}
          style={styles.logoImage}
        />
        <LoginField
          ref="1"
          placeholder="EMAIL"
          autoCapitalize="none"
          keyboardType="email-address"
          onChange={this._onTextInput.bind(this, 'email')}
          onSubmitEditing={() => this._focusNextField('2')}
          returnKeyType="next"
        />
        <LoginField 
          ref="2"
          placeholder="PASSWORD" 
          secureTextEntry={true} 
          onChange={this._onTextInput.bind(this, 'password')}
          onSubmitEditing={() => this._login()}
          returnKeyType="go"
        />
        <TouchableOpacity onPress={() => this._login()}>
          <View style={styles.loginButton}>
            <Text style={styles.loginButtonText}>
              LOGIN
            </Text>
            { this.state.loggingInWithEmail &&
              <ActivityIndicator
                animating={this.state.loggingInWithEmail}
                color="#fff"
                style={styles.activityIndicator}
              />
            }
          </View>
        </TouchableOpacity>
        <View style={styles.linksContainer}>
          <TouchableHighlight onPress={this._signUp}>
            <Text style={styles.linkText}>
              SIGN UP
            </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={this._forgotPassword}>
            <Text style={styles.linkText}>
              FORGOT PASSWORD
            </Text>
          </TouchableHighlight>
        </View>
        { Platform.OS === 'ios' && 
          <View>
            <Hr 
              wrapperStyle={styles.hrWrapperStyle}
              lineStyle={styles.hrLineStyle}
              textStyle={styles.hrTextStyle}
              text="OR"
            />
            <TouchableHighlight onPress={this._signInWithFacebook}>
              <View style={styles.facebookButton}>
                <Text style={styles.facebookButtonText}>
                  FACEBOOK SIGN-IN
                </Text>
                { this.state.loggingInWithFacebook &&
                  <ActivityIndicator
                    animating={this.state.loggingInWithFacebook}
                    color="#fff"
                    style={styles.activityIndicator}
                  />
                }
              </View>
            </TouchableHighlight>
          </View>
        }
      </ScrollView>
    );
  }

  render() {
    return (
      <Image
        style={styles.container}
        source={require('../assets/images/Login_Background.png')}>
        { Platform.OS === 'ios' && 
          <KeyboardAvoidingView behavior="padding"> 
            {this._renderInnerContents()}
          </KeyboardAvoidingView>
        }
        { Platform.OS !== 'ios' &&
          this._renderInnerContents()
        }
        <Toast ref="toast" position="bottom"/>
      </Image>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: null,
    width: null,
  },
  loginFieldsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    width: screenWidth,
  },
  linksContainer: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  linkText: {
    color: '#fff',
    fontFamily: 'Lato-Bold',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  facebookButton: {
    backgroundColor: '#3b5998',
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: 250,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hrWrapperStyle: {
    height: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  hrLineStyle: {
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    width: 100,
  },
  hrTextStyle: {
    color: 'white',
    backgroundColor: 'transparent',
    marginLeft: 15,
    marginRight: 15,
    fontFamily: 'Lato-Bold',
    fontSize: 10,
  },
  facebookButtonText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  logoImage: {
    width: 175,
    height: 175,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: Colors.tabIconSelected,
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: 250,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  loginField: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: 250,
  },
  loginFieldText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 15,
    height: 30,
  },
  hr: {
    color: '#fff',
    height: 1,
    backgroundColor: 'transparent',
  },
  activityIndicator: {
    paddingHorizontal: 5,
  },
});

export default LoginScreen;
