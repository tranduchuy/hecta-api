const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const uri = [
  'amqp://',
  rabbitMQConfig.username,
  ':',
  rabbitMQConfig.password,
  '@',
  rabbitMQConfig.host,
  ':',
  rabbitMQConfig.port
].join('');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');

const connectRabbitMQ = (cb) => {
  console.log('rabbitMQ uri', uri);
  amqp.connect(uri, function (err, conn) {
    if (err) {
      return cb(err);
    }
    console.log('Connect to RabbitMQ successfully');
    conn.createChannel(function (err, ch) {
      if (err) {
        return cb(err);
      }

      ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: true});
      return cb(null, ch);
    });
  });
};

module.exports = {
  connect: connectRabbitMQ
};