var requireAll = require('require-all');
var mongoose = require('mongoose');
var server = require('../config/server');
mongoose.Promise = global.Promise;

const connectDbStr = 'mongodb://' + server.DATABASE_SERVER + '/' + server.DATABASE_NAME;

mongoose.connect(connectDbStr, {useNewUrlParser: true}, function (err) {
    console.log('Connected mongodb : ', connectDbStr);
});

module.exports = requireAll(
    {
        dirname: __dirname,
        filter: /(.+Model)\.js$/,
        resolve: function (Model) {
            return Model;
        }
    }
);