import React from 'react';
import { 
  Image,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';

import Expo from 'expo';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';

import Images from '../util/Images';
import Colors from '../constants/Colors';

import Toast from 'react-native-easy-toast';
import DefaultNavOptions from '../constants/DefaultNavigationOptions';

import Firebase from '../util/Firebase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const isNullOrEmpty = (str) => {
  return str == null || str === '';
};


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
          autoCorrect={false}
          underlineColorAndroid="rgba(0,0,0,0.0)"
        />
      </View>
    );
  }
}

class RegistrationScreen extends React.Component {
  static navigationOptions = DefaultNavOptions;

  state = {
    inputValues: {},
    registering: false,
  }

  constructor(props) {
    super(props);
    this._register.bind(this);
  }


  componentDidMount() {
    const { params } = this.props.navigation.state;
    console.log('params');
    if (params && params.name) {
      this._onTextInput('name', params.name);
    }
  }

  _onTextInput(field, text) {
    console.log('_onTextInput' + field + ' ' + text);
    const state = this.state.inputValues;
    state[field] = text;
    this.setState({ inputValues: state });
  }

  async _register() {
    let user = Firebase.getAuthenticatedUser();
    const inputValues = this.state.inputValues;
    inputValues.showOnMap = true;
    inputValues.showContactInfo = false;
    inputValues.useExactLocation = true;
    inputValues.nearbyNotifications = true;
    // TODO: Check inputValues for required fields

    const { email, password, name } = inputValues;
    let inputsAreValid = false;
    const { params } = this.props.navigation.state;
    if (params && params.name) {
      inputsAreValid = !(isNullOrEmpty(email) || isNullOrEmpty(name));
    }
    else {
      inputsAreValid = !(isNullOrEmpty(email) || isNullOrEmpty(name) || isNullOrEmpty(password));
    }

    if (!inputsAreValid) {
      this.refs.toast.show('Name, email, and a password are required');
      return;
    }

    let success = false;

    // Check if the user exists (i.e. is signed in with FB already,
    // but not registered)
    if (user) {
      user.updateEmail(inputValues.email).then(
        () => {
          this._updateProfileData(user, inputValues);
        }, 
        (error) => { 
          this.refs.toast.show('Error: ' + error.message, 5000);
          console.log(error);
          this.setState({ registering: false });
        }
      );      
    }
    else {
      this._registerWithEmail(inputValues).then(user => {
        user.updateProfile({
          displayName: inputValues.name,
        }).then(
          () => {
            this._updateProfileData(user, inputValues);
          }, 
          (error) => { 
            this.refs.toast.show('Error: ' + error.message, 5000);
            this.setState({ registering: false });
            console.log(error);
          }
        );
      }).catch(error => {
        this.refs.toast.show('Error: ' + error.message, 5000);
        console.log(error);
        this.setState({ registering: false });
      });
    }
  }

  _registerWithEmail(userData) {
    this.setState({ registering: true });
    const { email, password } = userData;
    return Firebase.signupWithEmail(email, password);
  }

  async _updateProfileData(user, data) {
    this.setState({ registering: true });
    Firebase.registerUser(user.uid, data).then(
      () => {
        this.props.navigation.navigate('Home', { name: data.name });
      },
      (error) => {
        this.refs.toast.show('Error registering:' + error.message);
        this.setState({ registering: false });
      },
    );
  }

  _focusNextField(nextField) {
    this.refs[nextField].refs.TextInput.focus();
  }

  _renderInnerContents() {
    const { navigation } = this.props;
    const { params } = navigation.state;
    return (
      <ScrollView 
        contentContainerStyle={styles.loginFieldsContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHeader}>
          REGISTER
        </Text>
        <Image
          source={require('../assets/images/woody_mark.png')}
          style={styles.logoImage}
        />
        <LoginField
          ref="1"
          placeholder="NAME*"
          onChange={this._onTextInput.bind(this, 'name')}
          returnKeyType="next"
          autoCapitalize="words"
          defaultValue={ params ? params.name : null }
          onSubmitEditing={() => this._focusNextField('2')}
        />
        <LoginField
          ref="2"
          placeholder="EMAIL*" 
          autoCapitalize="none"
          keyboardType="email-address"
          onChange={this._onTextInput.bind(this, 'email')}
          returnKeyType="next"
          onSubmitEditing={() => this._focusNextField('3')}
        />
        <LoginField 
          ref="3"
          placeholder="PHONE"
          onChange={this._onTextInput.bind(this, 'phone')}
          returnKeyType="next"
          keyboardType="phone-pad"
          onSubmitEditing={() => { !params ?
            this._focusNextField('4') : this._focusNextField('5');
          }}
        /> 
        {!params && // Conditionally require password
          <LoginField 
            ref="4"
            placeholder="PASSWORD*" 
            secureTextEntry={true}
            onChange={this._onTextInput.bind(this, 'password')}
            returnKeyType="next"
            onSubmitEditing={() => this._focusNextField('5')}
          />
        }
        <Text style={styles.sectionHeaderText}>
          LOCATION
        </Text> 
        <LoginField 
          ref="5"
          placeholder="CITY"
          onChange={this._onTextInput.bind(this, 'city')}
          returnKeyType="next"
          onSubmitEditing={() => this._focusNextField('6')}
        />
        <LoginField 
          ref="6"
          placeholder="STATE"
          onChange={this._onTextInput.bind(this, 'state')}
          returnKeyType="done"
          onSubmitEditing={async () => await this._register()}
        />
        <TouchableOpacity onPress={async () => await this._register()}>
          <View style={styles.loginButton}>
            <Text style={styles.loginButtonText}>
              REGISTER
            </Text>
            { this.state.registering &&
              <ActivityIndicator
                color="#fff"
                style={styles.activityIndicator}
              />
            }
          </View>
        </TouchableOpacity>

        <View style={styles.linksContainer}>
          <TouchableHighlight onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              BACK TO LOGIN
            </Text>
          </TouchableHighlight>
        </View>
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
        <Toast ref="toast" position="bottom" />
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
  loginButton: {
    backgroundColor: Colors.tabIconSelected,
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: 250,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  activityIndicator: {
    paddingHorizontal: 5,
  },
  linksContainer: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'center',
  },
  linkText: {
    color: '#fff',
    fontFamily: 'Lato-Bold',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  loginButtonText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Lato-Bold',
  },
  loginField: {
    backgroundColor: '#fff',
    marginBottom: 7,
    paddingVertical: 8,
    paddingHorizontal: 30,
    width: 250,
  },
  loginFieldText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 15,
    height: 30,
  },
  loginFieldsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    width: screenWidth,
  },
  logoImage: {
    width: 175,
    height: 175,
    marginBottom: 20,
  },
  sectionHeaderText: {
    backgroundColor: 'transparent',
    color: '#fff',
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 5,
  },
  pageHeader: {
    backgroundColor: 'transparent',
    color: '#fff',
    fontFamily: 'CarterSansPro-Bold',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default RegistrationScreen;
