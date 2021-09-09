/* eslint-disable no-undef */
process.env.NODE_ENV = 'test';
const request = require('supertest');
const _ = require('lodash');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoClient = require('mongodb');

const app = require('../server');
const env = require('../env.json');

let rq;
let client;
let token;

beforeAll((done) => {
  rq = request(app);
  setTimeout(done, 4000);
});

beforeAll((done) => {
  mongoClient.connect(env.mongoURL, (er, connection) => {
    if (er) return done(er);
    client = connection;
    const db = client.db(env.testDatabase);
    db.dropDatabase()
      .then(() => {
        const newDb = client.db(env.testDatabase);
        const users = newDb.collection('users');
        users.insert(env.seedAdminUser)
          .then(() => {
            rq.post('/login')
              .send({ name: 'Admin', password: 'Admin' })
              .then((res) => {
                token = res.headers.authorization;
                done();
              });
            done();
          });
      })
      .catch((e) => done(e));
  });
});

afterAll((done) => {
  const db = client.db(env.testDatabase);
  db.dropDatabase()
    .then(() => done())
    .catch((e) => {
      console.log(e);
      done();
    });
});

describe('Functionality', () => {
  test('Should set authorization header on successful login', (done) => {
    rq.post('/login')
      .send({ name: 'Admin', password: 'Admin' })
      .then((res) => {
        expect(res.headers.authorization).toBeTruthy();
        done();
      });
  });
  test('/users/usersList api should get all users list', (done) => {
    rq.get('/users/usersList')
      .set('Authorization', token)
      .then((data) => {
        expect(data.body).toHaveLength(1);
        done();
      });
  });
  test('Admin should be able to create new users', (done) => {
    rq.post('/users/signup')
      .send({ name: 'Test', password: 'Test' })
      .set('Authorization', token)
      .then((res) => {
        expect(_.get(res, 'body.ops[0].name')).toBe('Test');
        done();
      });
  });
  test('Admin should be able to edit users', (done) => {
    rq.post('/users/signup')
      .send({ name: 'dummy', password: 'dummy' })
      .set('Authorization', token)
      .then((res) => {
        expect(_.get(res, 'body.ops[0].name')).toBe('dummy');
        const id = _.get(res, 'body.ops[0]._id');
        rq.patch(`/users/edit/${id}`)
          .send({ email: 'test@gmail.com' })
          .set('Authorization', token)
          .then((res2) => {
            expect(_.get(res2, 'body.nModified')).toBe(1);
            done();
          });
      });
  });
  test('Users should be allowed to create new groups', (done) => {
    rq.post('/groups/create')
      .send({ title: 'chat' })
      .set('Authorization', token)
      .then((res) => {
        expect(_.get(res, 'body.ops[0].title')).toBe('chat');
        done();
      });
  });
  test('Users should be allowed to add new users to groups', (done) => {
    rq.post('/users/signup')
      .send({ name: 'Test1', password: 'Test1' })
      .set('Authorization', token)
      .then((res) => {
        const userId = _.get(res, 'body.ops[0]._id');
        rq.post('/groups/create')
          .send({ title: 'chat1' })
          .set('Authorization', token)
          .then((res1) => {
            const groupId = _.get(res1, 'body.ops[0]._id');
            rq.post('/groups/addUser')
              .send({ userId, groupId })
              .set('Authorization', token)
              .then((res2) => {
                expect(_.get(res2, 'body.ops[0].userId')).toBe(userId);
                expect(_.get(res2, 'body.ops[0].groupId')).toBe(groupId);
                done();
              });
          });
      });
  });
  test('Users should be allowed to delete group', (done) => {
    rq.post('/groups/create')
      .send({ title: 'tobedeleted' })
      .set('Authorization', token)
      .then((res) => {
        expect(_.get(res, 'body.ops[0].title')).toBe('tobedeleted');
        const groupId = _.get(res, 'body.ops[0]._id');
        rq.delete(`/groups/delete/${groupId}`)
          .set('Authorization', token)
          .then((res1) => {
            expect(_.get(res1, 'body')).toEqual({ n: 1, ok: 1 });
            done();
          });
      });
  });
  test('Users should be able to search the groups based on group title', (done) => {
    rq.post('/groups/create')
      .send({ title: 'software company' })
      .set('Authorization', token)
      .then((res) => {
        expect(_.get(res, 'body.ops[0].title')).toBe('software company');
        rq.get('/groups/search?title=company')
          .set('Authorization', token)
          .then((res1) => {
            expect(_.get(res1, 'body')).toHaveLength(1);
            expect(_.get(res1, 'body[0].title')).toBe('software company');
            done();
          });
      });
  });
  test('Authorization token should be invalidated if user is logged out', (done) => {
    rq.get('/logout')
      .set('Authorization', token)
      .then(() => {
        rq.get('/users/usersList')
          .set('Authorization', token)
          .then((res1) => {
            expect(_.get(res1, 'error.text')).toBe('Unauthorized');
            expect(_.get(res1, 'statusCode')).toBe(401);
            done();
          });
      });
  });
});
