const express = require('express');
// const jwt = require('jsonwebtoken');
// const BluebirdPromise = require('bluebird');

const router = express.Router();
// eslint-disable-next-line import/no-extraneous-dependencies
const ObjectId = require('mongodb').ObjectID;

router.patch('/like/:id', (req, res) => {
  const id = req.params.id;
  if (!id || !ObjectId.isValid(id)) return res.sendStatus(401);
  const db = req.db;
  const likes = db.collection('Messagelikes');
  likes.find({ userId: req.loggedInUserId, messageId: id })
    .toArray()
    .then((info) => {
      if (info && info.length) return res.send('done');
      const obj = {
        userId: req.loggedInUserId,
        messageId: id,
        created: new Date(),
      };
      likes.insert(obj)
        .then((data) => res.send(data))
        .catch((error) => {
          console.log(error);
          res.sendStatus(404);
        });
    });
});

/* const checkIfRecordExists = (collectionName, id) => new BluebirdPromise((resolve, reject) => {
  if (!collectionName) return reject('No collection name');
  if (!id) return reject('No id');
  const mongodbClient = process.env.mongodbClient;
  const db = mongodbClient.db('chatApp');
  const collection = db.collection(collectionName);
  collection.find({ _id: new ObjectId(id) })
    .toArray()
    .then((records) => {
      if (records && records.length) return resolve(true);
      return resolve(false);
    })
    .catch((e) => reject(e));
}); */

/* router.post('/add', (req, res) => {
  const mongodbClient = process.env.mongodbClient;
  const db = mongodbClient.db('chatApp');
  const messages = db.collection('messages');
  if (!req.body) return res.send('Please send data');
  if (!req.body.message) return res.send('No message');
  if (!req.body.groupId) return res.send('Please send groupId');
  if (!ObjectId.isValid(req.body.groupId)) return res.send(`Invalid groupId - ${req.body.groupId}`);
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  const userToken = jwt.verify(token, 'secret');
  if (!userToken) return res.send('you are not authorized');
  const userId = userToken.userId;
  checkIfRecordExists('users', userId)
    .then((userExists) => {
      if (!userExists) return res.send('Unauthorized user');
      checkIfRecordExists('groups', req.body.groupId)
        .then((groupExists) => {
          if (!groupExists) return res.send(`Invalid group - ${req.body.groupId}`);
          const obj = {
            groupId: req.body.groupId,
            message: req.body.message,
            created: new Date(),
          };
          messages.insert(obj, (err, newMessage) => {
            if (err) {
              res.statusCode = 304;
              return res.send(`Found error - ${err}`);
            }
            res.statusCode = 201;
            res.send(newMessage);
          });
        })
        .catch((e) => res.send(e));
    })
    .catch((e2) => res.send(e2));
}); */

module.exports = router;
