const functions = require('firebase-functions');

const admin = require('firebase-admin');

const GeoFire = require('geofire');

const Expo = require('exponent-server-sdk');
let expo = new Expo();

admin.initializeApp(functions.config().firebase);

exports.addRecoToGeofire = functions.database.ref('recommendations/{id}').onWrite(event => {
  const recommendation = event.data.val();
  const coordinate = recommendation.coordinate;
  if (!coordinate) {
    return;
  }
  const geofireRef = event.data.adminRef.root.child('geofire/recommendations');
  const geoFire = new GeoFire(geofireRef);
  geoFire.set(event.data.key, [coordinate.latitude, coordinate.longitude]).then(() => {
    console.info('success');
  }).catch(error => {
    console.error('Error adding ' + event.data.key + ' to geofire');
  });
});

exports.updateUserGeofire = functions.database.ref('users/{uid}/location').onWrite(event => {
  const { uid } = event.params;
  const location = event.data.val();

  const geofireRef = event.data.adminRef.root.child('geofire/users');
  const geoFire = new GeoFire(geofireRef);
  geoFire.set(uid, [location.latitude, location.longitude]).then(() => {
    console.log('Updated user in geofire');
  }).catch(error => {
    console.error('Error adding ' + event.data.key + ' to geofire');
  });
});

exports.sendPushNotification = functions.database.ref('chats/{chatId}').onWrite(event => {
  const updateInfo = event.data.val();

  if (updateInfo.lastActivity) {
    const timeDiff = Date.now() - new Date(updateInfo.lastActivity).getTime();
    console.log(timeDiff);
    if (timeDiff > 1000 * 60 * 3) { // last message was sent >3 minutes ago
      return;
    }
  }

  if (!updateInfo.lastMessageAuthor) {
    return;
  }
  
  const author = updateInfo.lastMessageAuthor;
  const usernames = updateInfo.usernames;
  console.log(`Received message from ${author.name}`);
  // select the users to send push notifications to
  const usersToNotify = updateInfo.users.filter(id => id !== author._id);
  for (const userId of usersToNotify) {
    const userRef = event.data.adminRef.root.child(`users/${userId}/expoPushToken`);
    userRef.once('value').then(snapshot => {
      const token = snapshot.val();
      if (token && Expo.isExponentPushToken(token)) {
        const title = usernames.filter(user => user.id !== userId).map(user => user.name).join(', ');
        updateInfo.title = title;
        expo.sendPushNotificationsAsync([{
          to: token,
          sound: 'default',
          body: `${author.name}: ${updateInfo.lastMessage}`,
          data: {
            chatId: event.data.key,
            chatInfo: updateInfo
          },
          title: 'WoodyBoater',
        }]).then(receipts => {
          console.log('Successfully sent push');
          console.log(receipts);
        }).catch(error => {
          console.log('Error sending push notification');
          console.log(error);
        });
      }
    });
  }
  return;
});