const bcrypt = require('bcrypt');
const _ = require('lodash');
const env = require('../env.json');

const seedAdminUser = (db) => new Promise((resolve, reject) => {
  const user = db.collection('users');
  const obj = env.seedAdminUser;
  const salt = bcrypt.genSaltSync(env.bcryptSaltRounds);
  obj.password = bcrypt.hashSync(_.get(obj, 'password'), salt);
  if (!user) return reject(new Error('Problem accessing user model'));
  user.find({ name: obj.name })
    .toArray()
    .then((users) => {
      if (users && users.length) return resolve();
      user.insert(obj)
        .then(() => {
          console.log('created admin User');
          return resolve();
        })
        .catch((er) => {
          console.log(er);
          if (er) return reject(er);
        });
    });
});
module.exports = seedAdminUser;
