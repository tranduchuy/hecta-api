const config = require('config');
const mongoConfig = config.get('mongo');
const mongoose = require('mongoose');
const ENV = process.env.NODE_ENV;

module.exports = (callback) => {
    let connectDbStr = `mongodb://${mongoConfig['host']}:${mongoConfig['port']}/${mongoConfig['databaseName']}`;

    if (ENV === 'production') {
        connectDbStr = `mongodb://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig['host']}:${mongoConfig['port']}/${mongoConfig['databaseName']}`;
    }

    mongoose.connect(connectDbStr, {useNewUrlParser: true}, function (err) {
        if (err) {
            throw err;
        } else {
            callback();
        }
    });
};