const jwt = require('jsonwebtoken');
const BluebirdPromise = require('bluebird');
const _ = require('lodash');

const joinUserToRooms = (socket) => new BluebirdPromise((resolve, reject) => {
  const db = socket.db;
  const mapping = db.collection('userGroupMapping');
  const authorization = _.get(socket, 'handshake.headers.authorization');
  if (!authorization) return reject('Unauthorized user');
  const userToken = jwt.verify(authorization, 'secret');
  if (!userToken) return reject('Unauthorized user');
  mapping.find({ userId: userToken.userId })
    .toArray()
    .then((groups) => {
      console.log(`joining ${socket.loggedInUser.name} to groups ${JSON.stringify(groups)}`);
      groups.forEach((group) => {
        socket.join(group.groupId);
        return resolve();
      });
    })
    .catch((er) => reject(er));
});

const checkIfUserIsAGroupMember = (collection, userId, groupId, message) => new BluebirdPromise((res, rej) => {
  if (!collection || !userId || !groupId) return rej('Could not check if user is a member');
  collection.find({ userId, groupId })
    .toArray()
    .then((groups) => {
      if (!groups || !groups.length) rej(`User does not belong to group - ${groupId}`);
      const obj = {
        userId,
        groupId,
        text: message.text,
        likes: 0,
        created: new Date(),
      };
      return res(obj);
    })
    .catch((e) => rej(e));
});

const saveMessage = (collection, record) => new BluebirdPromise((res, rej) => {
  if (!record || !collection) return rej('Could not save message');
  collection.insert(record)
    .then(() => {
      console.log('broadcasting to group', _.get(record, 'groupId'));
      return res();
    })
    .catch((e) => rej(e));
});

const broadCastMessage = (message, socket) => {
  if (!message || !socket || !message.groupId || !message.text) return;
  socket.to(message.groupId).emit('reply', message.text);
};
const messageHandler = (message, socket) => {
  console.log(message);
  if (!message) return;
  const groupId = message.groupId;
  const db = socket.db;
  const mapping = db.collection('userGroupMapping');
  const messages = db.collection('messages');
  const authorization = _.get(socket, 'handshake.headers.authorization');
  if (!authorization) return;
  const userToken = jwt.verify(authorization, 'secret');
  if (!userToken) {
    console.log('Unauthorized');
    return;
  }
  checkIfUserIsAGroupMember(mapping, userToken.userId, groupId, message)
    .then((obj) => saveMessage(messages, obj))
    .then(() => broadCastMessage(message, socket))
    .catch((e) => {
      console.log(e);
    });
};

const initSocket = (io, socket) => {
  if (!io || !socket) return;
  console.log(`New connection from ${_.get(socket, 'loggedInUser.name')}`);
  joinUserToRooms(socket)
    .then(() => {
      socket.on('message', (message) => messageHandler(message, socket));
    })
    .catch((er) => console.log(er));
};
module.exports = initSocket;
