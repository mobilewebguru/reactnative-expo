import * as firebase from 'firebase';

import { Facebook } from 'expo';

import Geocoder from 'react-native-geocoding';
Geocoder.setApiKey('AIzaSyBpWhmQmx1cXVJq9Oihx19rTJ9yfRAt9po');

const db = firebase.database;

import Storage from './Storage';

const geofire = require('geofire');

class GeoFire {
  // static ref = new geofire(db().ref())
}

class Firebase {
  // get the user authenticated to firebase if one exists
  static getAuthenticatedUser() {
    return firebase.auth().currentUser;
  }

  // Returns true if the user is already authenticated, false otherwise
  static isAuthenticated() {
    return this.getAuthenticatedUser() !== null;
  }

  // Returns true if the user has not been registered yet
  static async userNotRegistered(userId) {
    const currentUser = await this.getCurrentUser();
    // Check if we need to create the user in the DB
    if (currentUser === null) {
      const user = this.getAuthenticatedUser();
      this.createNewUser(user.uid, user.displayName);
    }
    return currentUser === null || !currentUser.isRegistered;
  }

  // get the user's profile info (created at registration)
  static async getCurrentUser() {
    const userId = this.getAuthenticatedUser().uid;
    let result = {};
    await db().ref('users/' + userId).once('value').then(snapshot => {
      result = snapshot.val();
    });
    return result;
  }

  static async createExpoPushToken() {
    // verify there's a user to create a push token for
    if (!this.isAuthenticated()) {
      return;
    }

    // verify user doesn't already have a token
    const user = await this.getCurrentUser();
    if (user.expoPushToken) {
      return;
    }

    // get a token from Expo then add it to the database
    // const userToken 
  }

  // Creates an empty user profile
  static createNewUser(userId, name, email) {
    db().ref('users/' + userId).set({
      name: name,
      id: userId,
      isRegistered: false,
    });
  }

  static async getUsers() {
    let result = {};
    await db().ref('users/').once('value', snapshot => {
      result = snapshot;
    });
    return result;
  }

  static signupWithEmail(email, password) {
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  }

  static async loginWithEmail(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  static async addBoat(boatData, imageURI) {
    const user = this.getAuthenticatedUser();
    const userId = user.uid;
    if (user) {
      const boatsRef = db().ref('users/' + userId + '/boats');
      const newBoatRef = boatsRef.push();
      // upload image to S3
      const file = {
        uri: imageURI,
        name: newBoatRef.key + '.jpg',
        type: 'image/jpg',
      };
      const imageURL = await Storage.putImage(file);
      boatData.imageURL = imageURL;
      await newBoatRef.set(boatData);
    }
  }

  static async addRecommendation(data, imageURI) {
    const user = this.getAuthenticatedUser();
    const userId = user.uid;
    if (user) {
      const ref = db().ref('recommendations/').push();
      const file = {
        uri: imageURI,
        name: ref.key + '.jpg',
        type: 'image/jpg',
      };
      if (data.address && !data.coordinate) {
        try {
          const json = await Geocoder.getFromLocation(data.address);
          const coord = json.results[0].geometry.location;
          data.coordinate = {
            latitude: coord.lat,
            longitude: coord.lng,
          };
        }
        catch (e) {
          console.log('Error setting recommendation address');
          console.log(e);
        }
      }
      const imageURL = await Storage.putImage(file);
      data.imageURL = imageURL;
      await ref.set(data);
    }
  }

  static async getUsersNear(location, radius) {
  }

  // Assumes the favorite toggling is done by the current user
  static async toggleEventFavorite(eventId) {
    // Get the event
    let result = null;
    await db().ref('events/' + eventId).once('value', snap => {
      result = snap.val();
    });
    if (result) {
      console.log(result);
      const userId = this.getAuthenticatedUser().uid;
      let attendees = result.attendees || [];
      if (attendees.includes(userId)) {
        // filter out this user
        attendees = attendees.filter(id => id !== userId);
      }
      else {
        attendees.push(userId);
      }
      db().ref('events/' + eventId + '/attendees').set(attendees);
    }
  }

  static async toggleRecommendationFavorite(id) {
    // Get the event
    let result = null;
    await db().ref('recommendations/' + id).once('value', snap => {
      result = snap.val();
    });
    if (result) {
      const userId = this.getAuthenticatedUser().uid;
      let favorited = result.favorited || [];
      if (favorited.includes(userId)) {
        // filter out this user
        favorited = favorited.filter(id => id !== userId);
      }
      else {
        favorited.push(userId);
      }
      db().ref('recommendations/' + id + '/favorited').set(favorited);
    }
  }

  // TODO: only fetch nearby events
  static async getEvents() {
    let result = {};
    await db().ref('events/').once('value', snapshot => {
      result = snapshot;
    });
    return result;
  }

  static async createEvent(eventData) {
    const user = this.getAuthenticatedUser();
    eventData.owner = user.uid;
    eventData.attendees = [];

    if (user) {
      const eventsRef = db().ref('events');
      const newEventRef = eventsRef.push();
      await newEventRef.set(eventData).catch(err => console.log(err));
    }
  }

  static async loginWithFacebook(token, onError) {
    const credential = firebase.auth.FacebookAuthProvider.credential(token);
    let userObj = {};
    await firebase.auth()
      .signInWithCredential(credential)
      .then(user => {
        userObj = user;
      })
      .catch(onError);
    return userObj;
  }

  // userIds is an array of user ids to be added to this chat
  /**
   * returns { id: the chat id, info: the chat's metadata }
   */
  static async createChat(userIds) {
    const chatRef = db().ref('chats');
    const newChatRef = chatRef.push();
    /*
      Message structure:
      message: {
        id: string, // the id of the message
        author: userId, // the author's WoodyBoater uid
        text: string, // contents of the message
        createdAt: number, // ms since 1 Jan 1970; see Date.now()
      }
    */ 
    const chatInfo = {
      users: userIds, // array of userIds
      messages: [], // array of messages
      lastActivity: null,
      usernames: await this.getUsernames(userIds),
    };

    // add chat id to each user's chats
    for (const userId of userIds) {
      // get user's chats
      const userChatsRef = db().ref('users/' + userId + '/chats');
      userChatsRef.once('value', async snapshot => {
        const userChats = snapshot.val() || {};
        // chats are stored in user data as arrays of userids
        userChats[newChatRef.key] = userIds;
        await userChatsRef.set(userChats);
      });
    }

    // create the chat room
    await newChatRef.set(chatInfo);
    return {
      id: newChatRef.key,
      info: chatInfo,
    };
  }

  static async getUsernames(userIds) {
    const usernames = [];
    for (const userId of userIds) {
      await firebase.database().ref(`users/${userId}/name`).once('value', data => {
        usernames.push({
          id: userId,
          name: data.val(),
        });
      });
    }
    return usernames;
  }

  static async addUserToChat(user, chatId, chatInfo) {
    
  }

  static updateUserData(userId, userData) {
    // TODO handle password updates?
    if (userData.password) {
      delete userData.password;
    }
    if (userData.confirmPassword) {
      delete userData.confirmPassword;
    }

    return db().ref('users/' + userId).update(userData);
  }

  static registerUser(userId, userData) {
    userData.location = {
      latitude: this.getRandomLocation(38.889175, -0.0230),
      longitude: this.getRandomLocation(-77.169065, 0.010525),
    };

    userData.isRegistered = true;
    if (userData.password) {
      // make sure we don't store plaintext passwords in the db....
      delete userData.password;
    }
    return db().ref('users/' + userId).update(userData);
  }

  static getRandomLocation(start, delta) {
    return start + delta * Math.random();
  }
}

export { GeoFire };
export default Firebase;
