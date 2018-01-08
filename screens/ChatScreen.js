import React from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import Hr from '../components/Hr';

import Colors from '../constants/Colors';

import Firebase from '../util/Firebase';
import { getChatTitle } from '../util/ChatUtils';

import * as firebase from 'firebase';
import moment from 'moment';

const { width, height } = Dimensions.get('screen');
const viewportWidth = width - 20;

class ChatListing extends React.Component {
  render() {
    const { lastActivity } = this.props;
    return (
      <TouchableHighlight
        style={styles.chatContainer}
        onPress={() => this.props.onPress()}
        underlayColor={Colors.searchBackground}>
        <View>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>
              {this.props.title}
            </Text>
            { lastActivity &&
              <Text style={styles.lastActivityText}>
                {lastActivity}
              </Text>
            }
          </View>
          <Text style={styles.lastMessageText}>
            {this.props.info.lastMessage}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

class ChatScreen extends React.Component {
  state = {
    chats: [], // placeholderChats
    dbListeners: [],
    currentUserId: Firebase.getAuthenticatedUser().uid,
  }

  componentDidMount() {
    this._addEventListeners();
  }

  componentWillUnmount() {
    const { dbListeners } = this.state;
    Object.keys(dbListeners).forEach(id => {
      const listener = dbListeners[id];
      listener.eventTypes.forEach(eventType => listener.ref.off(eventType));
    });
  }

  _addEventListeners() {
    const userId = firebase.auth().currentUser.uid;
    const chatsRef = firebase.database().ref(`users/${userId}/chats`);
    chatsRef.on('child_added', data => this._onChatListUpdate(data));
    chatsRef.on('child_changed', data => this._onChatListUpdate(data));

    this.setState(prevState => {
      const listeners = Object.assign({}, prevState.dbListeners);
      listeners['chatsRef'] = {
        ref: chatsRef,
        eventTypes: ['child_added', 'child_changed'],
      };
      return { dbListeners: listeners };
    });

  }

  _onChatListUpdate(data) {
    const currentChats = this.state.chats;
    const currentChatKeys = currentChats.map(chat => chat.key);
    
    const chatId = data.key;
    if (currentChatKeys.includes(chatId)) {
      return; // Ignore duplicates
    }

    // listen for updates to the chat's metadata
    const chatRef = firebase.database().ref(`chats/${chatId}`);
    chatRef.on('value', snapshot => this._setChatListState(snapshot));

    // add this observer to the state
    this.setState(prevState => {
      const listeners = Object.assign({}, prevState.dbListeners);
      listeners[chatId] = {
        ref: chatRef,
        eventTypes: ['value'],
      };
      return { dbListeners: listeners };
    });
  }

  // Updates the chat info boxes in the "Your Chats" section
  _setChatListState = (data) => {
    const chatId = data.key;
    const chatInfo = data.val();
    
    if (!chatInfo.lastMessageTimestamp) {
      return;
    }

    // use the chat's users to generate a title if there isn't one
    if (!chatInfo.title) {
      chatInfo.title = getChatTitle(chatInfo.usernames, this.state.currentUserId);
    }

    if (chatInfo.lastActivity) {
      chatInfo.lastActivity = moment(chatInfo.lastActivity).fromNow().toUpperCase();
    }

    this.setState(prevState => {
      const chats = prevState.chats.filter(chat => chat.key !== chatId);
      chats.unshift({
        key: chatId,
        data: chatInfo,
      });
      chats.sort((chatA, chatB) => chatB.data.lastMessageTimestamp - chatA.data.lastMessageTimestamp);
      return { chats: chats };
    });
  }

  _navigateToChat(chatId, chatInfo) {
    const { navigate } = this.props.navigation;
    navigate('ChatView', { 
      id: chatId,
      info: chatInfo,
    });
  }

  _createChatLink(chatId, chatInfo) {
    if (!chatInfo.lastMessage) {
      return;
    }
    return (
      <ChatListing
        key={chatId}
        chatId={chatId}
        title={chatInfo.title}
        info={chatInfo}
        onPress={() => this._navigateToChat(chatId, chatInfo)}
        lastActivity={chatInfo.lastActivity}
        numParticipating={chatInfo.numParticipating}
      />
    );
  }

  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container}>
          <FlatList
            data={this.state.chats}
            renderItem={({item}) => this._createChatLink(item.key, item.data)}
            style={styles.joinedChats}
            removeClippedSubviews={false}
          />
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigate('ChatSettingsScreen', { chatInfo: {}, chatId: -1, createChat: true })}>
            <View style={styles.createChatButton}>
              <Text style={styles.createChatButtonText}>
                START A CHAT
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  footer: {
    height: 44,
  },
  createChatButton: {
    backgroundColor: Colors.tabIconSelected,
    marginVertical: 5,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: viewportWidth,
    alignSelf: 'center',
  },
  createChatButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'CarterSansPro-Bold',
  },
  joinedChats: {
    flex: 1
  },
  chatTitle: {
    color: Colors.tabIconSelected,
    fontFamily: 'Lato-Bold',
    fontSize: 13,
  },
  chatContainer: {
    padding: 5,
    margin: 5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: Colors.searchBackground,
  },
  chatHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between'
  },
  lastActivityText: {
    fontSize: 10,
    marginVertical: 5,
    color: Colors.tabIconDefault,
  },
  lastMessageText: {
    fontSize: 11,
    marginVertical: 8,
    color: Colors.tabIconDefault,

  }
});

export default ChatScreen;
