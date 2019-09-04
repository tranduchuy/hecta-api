const config = require('config');
const mongoConfig = config.get('mongo');
const mongoose = require('mongoose');

module.exports = (callback) => {
  const connectDbStr = `mongodb+srv://${mongoConfig.username}:${mongoConfig.password}@cluster0-sffz7.gcp.mongodb.net/test?retryWrites=true&w=majority`;
  console.log(connectDbStr);

  mongoose.connect(connectDbStr, {useNewUrlParser: true}, function (err) {
    if (err) {
      throw err;
    } else {
      callback();
    }
  });
};
