const config = require('config');
const mongoConfig = config.get('mongo');
const mongoose = require('mongoose');

module.exports = (callback) => {
  const connectDbStr = `mongodb+srv://${mongoConfig.username}:${mongoConfig.password}@hecta-ye9xf.mongodb.net/hecta_v2?retryWrites=true`;

  console.log('Connection String: ', connectDbStr);

  mongoose.connect(connectDbStr, {useNewUrlParser: true}, function (err) {
    if (err) {
      throw err;
    } else {
      callback();
    }
  });
};
require('../../web/models/LeadModel');
