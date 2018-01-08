import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

import Colors from '../constants/Colors';

import { GiftedChat } from 'react-native-gifted-chat';

import * as firebase from 'firebase';
import moment from 'moment';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { Ionicons } from '@expo/vector-icons';

import { getChatTitle } from '../util/ChatUtils';

/**
 * Utility class for creating messages
 */
class Message {
  constructor(message) {
    // apply the properties from the given message to this 
    Object.assign(this, message);
    if (this.createdAt && typeof this.createdAt !== 'string') {
      this.createdAt = message.createdAt.toUTCString();
    }
  }
}

class ChatSettingsButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress()}>
        <Ionicons 
          name="ios-settings-outline" 
          size={32} 
          color={Colors.tabIconDefault} 
          style={styles.settingsIcon}
        />
      </TouchableOpacity>
    );
  }
}

class Chat extends React.Component {
  state = {
    settingsModalVisible: false,
  }

  // Nav options can be defined as a function of the screen's props:
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.info.title}`,
    headerTitleStyle: {
      color: Colors.woodyBlue,
      fontFamily: 'Lato-Bold',
      fontSize: 18,
    },
    headerStyle: {
      marginTop: Platform.OS === 'ios' ? 0 : 25,
    },
    headerRight: (
      <ChatSettingsButton
        onPress={() => {
          navigation.navigate('ChatSettingsScreen', navigation.state.params);
        }}
      />
    ),
    gesturesEnabled: true,
  });

  async componentWillMount() {
    const { id, info } = this.props.navigation.state.params;
    const messagesRef = firebase.database().ref(`messages/${id}`);
    const chatRef = firebase.database().ref(`chats/${id}`);
    const userId = firebase.auth().currentUser.uid;
    const username = info.usernames.filter(user => user.id === userId)[0].name;
    this.setState({
      messages: [],
      id: id,
      info: info,
      messagesRef: messagesRef,
      userId: userId,
      chatRef: chatRef,
      username: username,
    });
    // fetch chat messages
    this.addEventListeners(id, info, messagesRef, chatRef);
  }

  componentWillUnmount() {
    const { messagesRef, chatRef } = this.state;
    messagesRef.off('child_added');
    messagesRef.off('child_changed');
    chatRef.off('child_changed');
  }

  addEventListeners(id, info, messagesRef, chatRef) {
    messagesRef.on('child_added', data => this.onMessageAdded(data));
    messagesRef.on('child_changed', data => this.onMessageAdded(data));
    chatRef.on('child_changed', data => this.onMetadataUpdate(data));
  }

  onMetadataUpdate(data) {
    const newChatInfo = data.val();
    if (!newChatInfo.title) {
      newChatInfo.title = getChatTitle(newChatInfo.usernames, this.state.userId);
    }

    this.props.navigation.setParams({ info: newChatInfo, id: data.key });
  }

  onMessageAdded(data) {
    const id = data.key;
    const message = new Message(data.val());

    this.setState(prevState => ({
      messages: GiftedChat.append(prevState.messages, [message])
    }));
  }

  // Handles the event emitted by sending a message
  async onSend(messages = []) {
    const { id, messagesRef } = this.state;
    
    // Add the message to firebase
    for (const msg of messages) {
      const newMessageRef = messagesRef.push();
      await newMessageRef.set(new Message(msg));
    }

    // Update chat meta info
    const lastMessage = messages[0];
    this.updateChatInfo(new Message(lastMessage));

    /* 
    --- 
    TODO: Have "sending" state that updates when we confirm that
    the message has been added to the database
    ---
    */
  }

  async updateChatInfo(lastMessage) {
    const { chatRef } = this.state;

    const updates = {};
    updates['lastActivity/'] = lastMessage.createdAt;
    updates['lastMessage/'] = lastMessage.text;
    updates['lastMessageAuthor/'] = lastMessage.user;
    updates['lastMessageTimestamp/'] = Date.now();

    await chatRef.update(updates);
  }
  
  render() {
    // The screen's current route is passed in to `props.navigation.state`:
    const { userId, username } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar hidden={false}/>
        <GiftedChat
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: userId,
            name: username,
          }}
        />
        { Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsIcon: { 
    paddingHorizontal: 10 
  },
});

export default Chat;