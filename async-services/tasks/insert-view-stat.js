const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const adminAccount = config.get('adminAccount');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');
const uri = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;
const async = require('async');
const CDP_APIS = require('../../web/config/cdp-url-api.constant');

// models
const ViewStatModel = require('../../web/models/ViewStatModel');
let token = '';

const loginCDP = (cb) => {
  post(CDP_APIS.USER.LOGIN, adminAccount)
    .then((response) => {
      return cb(null, response.data.meta.token);
    })
    .catch((err) => {
      return cb(err);
    })
};

const connectRabbitMQ = (cb) => {
  amqp.connect(uri, function (err, conn) {
    if (err) {
      return cb(err);
    }
    console.log('Connect to RabbitMQ successfully');

    conn.createChannel(function (err, ch) {
      if (err) {
        return cb(err);
      }

      ch.assertQueue(RABBIT_MQ_CHANNELS.INSERT_VIEW_STAT_WHEN_VIEW_SALE, {durable: true});
      return cb(null, ch);
    });
  });
};

module.exports = () => {
  async.parallel([
    loginCDP,
    connectRabbitMQ
  ], (err, results) => {
    if (err) {
      throw err;
    }

    token = results[0];
    const channel = results[1];
  });
};