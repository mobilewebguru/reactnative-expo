import React from 'react';
import { 
  View, 
  Dimensions, 
  Text, 
  StyleSheet,
  Animated,
  TouchableHighlight,
  Image,
  ViewPropTypes,
} from 'react-native';
import Colors from '../constants/Colors';
const { width, height } = Dimensions.get('screen');

import moment from 'moment';

class MessageNotification extends React.Component {
  state = {
    visible: false,
    author: '',
    message: '',
    opacityValue: new Animated.Value(0),
    receiptTime: '',
  }

  show(messageInfo, duration = 5000) {
    const { lastActivity, lastMessage, lastMessageAuthor } = messageInfo;
    const author = lastMessageAuthor.name.split(' ')[0];
    let receiptTime = moment(lastActivity).fromNow().toUpperCase();
    if (receiptTime === 'A FEW SECONDS AGO') {
      receiptTime = 'JUST NOW';
    }
    this.setState({
      visible: true,
      message: lastMessage,
      author: author,
      receiptTime: receiptTime,
    });

    Animated.timing(
      this.state.opacityValue,
      {
        toValue: this.props.opacity,
        duration: this.props.fadeInDuration,
      }
    ).start(() => {
      this.hide(duration);
    });    
  }

  hide(delay) {
    Animated.timing(
      this.state.opacityValue,
      {
        toValue: 0,
        duration: this.props.fadeOutDuration,
        delay: delay,
      }
    ).start(() => {
      // reset state once animation is hidden
      this.setState({
        title: '',
        message: '',
        visible: false,
      });
    });
  }

  render() {
    const { 
      opacityValue, 
      visible, 
      author, 
      message, 
      receiptTime 
    } = this.state;
    
    if (!visible) {
      return null;
    }
    return (
      <View style={styles.container}>
        <TouchableHighlight onPress={() => {
          this.props.onPress();
          this.setState({ visible: false });
        }}>
          <Animated.View style={[styles.content, { opacity: opacityValue }]}>
            <View style={styles.header}>
              <View style={styles.title}>
                <Image
                  source={require('../assets/images/notification_icon.png')}
                  style={styles.icon}
                />
                <Text style={styles.headerText}>
                  WoodyBoater
                </Text>
              </View>
              <Text style={styles.bodyText}>
                {receiptTime}
              </Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.authorText}>
                {`${author}: `}
              </Text>
              <Text style={styles.bodyText}>
                {message}
              </Text>
            </View>
          </Animated.View>
        </TouchableHighlight>
      </View>
    );
  }
}

MessageNotification.propTypes = {
  style: ViewPropTypes.style,
  opacity: React.PropTypes.number,
  fadeInDuration: React.PropTypes.number,
  fadeOutDuration: React.PropTypes.number,
  onPress: React.PropTypes.func.isRequired,
};

MessageNotification.defaultProps = {
  fadeInDuration: 200,
  fadeOutDuration: 200,
  opacity: 1,
  onPress: () => null,
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 5,
    width: width * .9,
  },
  icon: {
    height: 18,
    width: 18,
  },
  title: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  headerText: {
    fontFamily: 'CarterSansPro-Bold',
    color: Colors.tabIconDefault,
    fontSize: 16,
    paddingLeft: 5,
  },
  authorText: {
    fontSize: 14,
    paddingVertical: 5,    
    fontWeight: 'bold',
  },
  bodyText: {
    fontSize: 14,
    paddingVertical: 5,
    fontWeight: 'normal',
  },
  header: {
    backgroundColor: 'rgb(233, 233, 233)',
    padding: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgb(204, 204, 204)',
    padding: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
});

export default MessageNotification;