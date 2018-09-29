const config = require('config');
const mongoConfig = config.get('mongo');
const mongoose = require('mongoose');

module.exports = (callback) => {
    const connectDbStr = `mongodb://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig['host']}:${mongoConfig['port']}/${mongoConfig['databaseName']}`;

    console.log('Connection String: ', connectDbStr);

    mongoose.connect(connectDbStr, {useNewUrlParser: true}, function (err) {
        if (err) {
            throw err;
        } else {
            callback();
        }
    });
};