const express = require('express');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcrypt');

const router = express.Router();
// eslint-disable-next-line import/no-extraneous-dependencies
const ObjectId = require('mongodb').ObjectID;

const env = require('../env.json');

// To get All users list
router.get('/usersList', (req, res) => {
  const db = req.db;
  const query = {};
  // eslint-disable-next-line no-underscore-dangle
  if (_.get(req, 'query.id')) query._id = new ObjectId(req.query.id);
  const users = db.collection('users');
  users.find(query)
    .toArray()
    .then((data) => {
      // do not send password in the users list
      _.each(data, (user) => delete user.password);
      res.send(data);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(404);
    });
});

router.patch('/edit/:id', (req, res) => {
  const db = req.db;
  const users = db.collection('users');
  const body = _.get(req, 'body');
  const id = _.get(req, 'params.id');
  if (!body || !id) return res.send('In-valid data');
  // eslint-disable-next-line no-underscore-dangle
  delete body._id;
  users.updateOne({ _id: new ObjectId(id) }, { $set: body })
    .then((data) => res.send(data))
    .catch((error) => {
      console.log(error);
      res.sendStatus(404);
    });
});

router.get('/isAdmin', (req, res, next) => {
  const token = _.get(req, 'headers.authorization') || _.get(req, 'cookies.token');
  const db = req.db;
  if (!token) return res.sendStatus(401);
  const userToken = jwt.verify(token, 'secret');
  if (!userToken) return next('you are not authorized');
  db.collection('users')
    .findOne({ _id: new ObjectId(userToken.userId) })
    .then((user1) => {
      if (!user1) return res.sendStatus(401);
      if (user1.isAdmin) return res.send(true);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(401);
    });
});

router.post('/signup', (req, res) => {
  const db = req.db;
  const users = db.collection('users');
  if (!_.get(req, 'loggedInUser.isAdmin')) return res.send('You are not authorized to add new user');
  users.find({ name: _.get(req, 'body.name') }, (er, u) => {
    u.toArray()
      .then((list) => {
        const msg = 'You are already having an account. Please login';
        if (list && list.length) return res.send(msg);
        if (_.get(req, 'body.isAdmin')) delete req.body.isAdmin;
        const salt = bcrypt.genSaltSync(env.bcryptSaltRounds);
        const obj = {
          name: _.get(req, 'body.name'),
          email: _.get(req, 'body.email'),
          password: bcrypt.hashSync(_.get(req, 'body.password'), salt),
        };
        users.insert(obj, (err, newuser) => {
          if (err) {
            res.statusCode = 401;
            return res.send(`Found error - ${err}`);
          }
          res.statusCode = 201;
          res.send(newuser);
        });
      });
  });
});

module.exports = router;
