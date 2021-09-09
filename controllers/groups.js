const express = require('express');
const _ = require('lodash');
const BluebirdPromise = require('bluebird');
// eslint-disable-next-line import/no-extraneous-dependencies
const ObjectId = require('mongodb').ObjectID;
const { reject } = require('bluebird');

const router = express.Router();

router.post('/create', (req, res) => {
  const db = req.db;
  const groups = db.collection('groups');
  if (!_.get(req, 'body.title')) return res.send('Invalid data');
  groups.find({ name: req.body.title })
    .toArray()
    .then((list) => {
      if (list.length) return res.send('A group already exists with this title');
      const obj = {
        title: req.body.title,
      };
      groups.insert(obj, (err, newGroup) => {
        if (err) {
          res.statusCode = 401;
          return res.send(`Found error - ${err}`);
        }
        res.statusCode = 201;
        res.send(newGroup);
      });
    });
});

router.delete('/delete/:id', (req, res) => {
  const db = req.db;
  const groups = db.collection('groups');
  const query = { _id: new ObjectId(_.get(req, 'params.id')) };
  groups.find(query)
    .toArray()
    .then((list) => {
      if (!list || !list.length) return res.send(`Group not found - ${req.params.id}`);
      groups.remove(query, (err, data) => {
        if (err) {
          res.statusCode = 401;
          return res.send(`Found error - ${err}`);
        }
        res.send(data);
      });
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(401);
    });
});

// search the group based on title
router.get('/search', (req, res) => {
  const like = _.get(req, 'query.title');
  const db = req.db;
  const groups = db.collection('groups');
  const pattern = `.*${like}.*`;
  groups.find({ title: { $regex: pattern } })
    .toArray()
    .then((list) => res.send(list))
    .catch((er) => {
      console.log(er);
      return res.sendStatus(401);
    });
});

// fetch all groups
router.get('/all', (req, res) => {
  const db = req.db;
  const groups = db.collection('groups');
  groups.find({})
    .toArray()
    .then((list) => res.send(list))
    .catch((error) => {
      console.log(error);
      res.sendStatus(401);
    });
});
const checkIfRecordExists = (id, collection) => new BluebirdPromise((res, rej) => {
  if (!id) return rej('No id');
  if (!collection) return reject('Could not verify group');
  collection.find({ _id: new ObjectId(id) })
    .toArray()
    .then((list) => {
      if (!list || !list.length) return rej(`Invalid id - ${id}`);
      return res();
    })
    .catch((e) => rej(e));
});

const checkIfAlreadyMemberOfGroup = (groupId, userId, collection) => new BluebirdPromise((res, rej) => {
  if (!groupId || !userId || !collection) return rej('Could not check if user is already member');
  collection.find({ groupId, userId })
    .toArray()
    .then((data) => {
      if (data && data.length) return rej('Already member');
      const obj = {
        groupId,
        userId,
      };
      return res(obj);
    })
    .catch((e) => rej(e));
});

const addUserToGroup = (obj, collection) => new BluebirdPromise((res, rej) => {
  if (!obj || !collection) return rej('Could not add user to group');
  collection.insert(obj)
    .then((response) => res(response))
    .catch((error) => rej(error));
});

// add members to groups
router.post('/addUser', (req, res) => {
  const db = req.db;
  const mapping = db.collection('userGroupMapping');
  const groups = db.collection('groups');
  const users = db.collection('users');
  const body = req.body;
  const msg = 'Invalid data. Please send userId and groupId';
  if (!body || !body.groupId || !body.userId) return res.send('');
  if (!ObjectId.isValid(body.groupId) || !ObjectId.isValid(body.userId)) return res.send(msg);
  // check if group is valid
  checkIfRecordExists(body.groupId, groups) // validate group
    .then(() => checkIfRecordExists(body.userId, users)) // validate user
    .then(() => checkIfAlreadyMemberOfGroup(body.groupId, body.userId, mapping))
    .then((obj) => addUserToGroup(obj, mapping))
    .then((response) => res.send(response))
    .catch((e) => {
      console.log(e);
      res.sendStatus(401);
    });
});

module.exports = router;
