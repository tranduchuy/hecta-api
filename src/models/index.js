// var mongoose = require('mongoose');
var requireAll = require('require-all');
// var mongoose = require('mongoose');
// var server = require('../config/server');
// mongoose.Promise = global.Promise;

// mongoose.connect('mongodb://'+server.DATABASE_SERVER+'/'+server.DATABASE_NAME, function (err) {
//     console.log('Connected mongodb : ','mongodb://'+server.DATABASE_SERVER+'/'+server.DATABASE_NAME);
// });

module.exports = requireAll(
  {
    dirname: __dirname,
    filter: /(.+Model)\.js$/,
    resolve: function (Model) {
      return Model;
    }
  }
)