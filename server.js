const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cp = require('cookie-parser');
const socketIO = require('socket.io');
const redis = require('redis');
const http = require('http');
const BluebirdPromise = require('bluebird');
const bcrypt = require('bcrypt');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoClient = require('mongodb').MongoClient;
// eslint-disable-next-line import/no-extraneous-dependencies
const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash');

const env = require('./env.json');
const user = require('./controllers/users');
const groups = require('./controllers/groups');
const messages = require('./controllers/message');
const chatHandler = require('./controllers/chatHandler');
const seedAdminUser = require('./boot/seedAdminUser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let mongodbClient;
let db;
let socketIo;

const redisClient = redis.createClient(env.redis);
app.use(cp());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.locals.dir = __dirname;

app.use(express.static(`${__dirname}/public`));

const validateUser = (args) => new BluebirdPromise((resolve, reject) => {
  let token;
  if (_.get(args, 'headers.authorization')) token = args.headers.authorization;
  else if (_.get(args, 'cookies.token')) token = args.cookies.token;
  else if (_.get(args, 'handshake.headers.authorization')) token = args.handshake.headers.authorization;
  if (!token) return reject('UnAuthorized');
  const userToken = jwt.verify(token, 'secret');
  if (!userToken) return reject('UnAuthorized');
  redisClient.get(token, (err, redisToken) => {
    if (err) return reject('Could not authenticate user');
    if (!redisToken) return reject('UnAuthorized');
    db.collection('users')
      .findOne({ _id: new ObjectId(userToken.userId) })
      .then((user1) => {
        if (!user1) return reject('UnAuthorized');
        args.loggedInUser = user1;
        args.loggedInUserId = userToken.userId;
        return resolve();
      })
      .catch((e) => reject(e));
  });
});

// middleware to validate user
app.use((req, res, next) => {
  req.mongodbClient = mongodbClient;
  req.db = (process.env.NODE_ENV === 'test') ? mongodbClient.db('chatAppTest') : mongodbClient.db('chatApp');
  if (req.url === '/login' || req.url === '/logout' || req.url === '/signup') return next();
  validateUser(req)
    .then(() => next())
    .catch(() => res.sendStatus(401));
});

// middleware to validate socket connections
io.use((socket, next) => {
  socket.mongodbClient = mongodbClient;
  socket.db = (process.env.NODE_ENV === 'test') ? mongodbClient.db('chatAppTest') : mongodbClient.db('chatApp');
  socket.io = socketIo;
  validateUser(socket)
    .then(() => next())
    .catch((err) => {
      console.log(err);
      return next(err);
    });
});

io.on('connection', (socket) => {
  chatHandler(io, socket);
});

app.use('/users', user);

app.use('/groups', groups);

app.use('/messages', messages);

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/views/index.html`);
});

app.get('/login', (req, res) => {
  res.sendFile(`${__dirname}/public/login.html`);
});

app.get('/signup', (req, res) => {
  res.sendFile(`${__dirname}/public/signup.html`);
});

app.post('/login', (req, res) => {
  const users = db.collection('users');
  users.findOne({ name: req.body.name })
    .then((u) => {
      if (!u) {
        res.statusCode = 401;
        return res.send('Invalid credentials');
      }
      if (!bcrypt.compareSync(req.body.password, u.password)) return res.send('Invalid password');
      // eslint-disable-next-line no-underscore-dangle
      const payload = { userId: u._id };
      const token = jwt.sign(payload, 'secret');
      redisClient.set(token, true);
      redisClient.expire(token, env.jwtTokenExpireTime);
      res.setHeader('Authorization', token);
      res.cookie('token', token);
      res.statusCode = 200;
      res.redirect('/');
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(401);
    });
});

app.get('/logout', (req, res) => {
  const token = _.get(req, 'headers.authorization') || _.get(req, 'cookies.token');
  redisClient.del(token, () => {
    res.clearCookie('token');
    res.sendStatus(200);
  });
});

app.use('/*', (req, res) => {
  res.sendFile(`${__dirname}/public/views/index.html`);
});
const url = env.mongoURL;
mongoClient.connect(url, (er, client) => {
  if (er) {
    console.log(er);
    process.exit(1);
  }
  mongodbClient = client;
  socketIo = io;
  db = process.env.NODE_ENV === 'test' ? mongodbClient.db('chatAppTest') : mongodbClient.db('chatApp');
  console.log('connected to mongoDB');
  seedAdminUser(db)
    .then(() => {
      server.listen('8000', (err) => {
        if (err) console.log(err);
        else console.log('Web server listening on port:8000');
        module.exports = () => app;
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = app;
