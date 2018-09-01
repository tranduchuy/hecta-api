var mongoose = require('mongoose');
var config = require('config');
var mongoDb = config.get('mongo');

var connectEles = [
  'mongodb://',
  mongoDb.host,
  ':',
  mongoDb.port,
  '/',
  mongoDb.databaseName
];

var connectionString = connectEles.join('');

module.exports = function (callback) {
  mongoose.connect(connectionString, function(err) {
    if (err) {
      console.error('Cannot connect database: ', err);
      return;
    }

    console.log('Connect database successfully');
    return callback();
  });
};