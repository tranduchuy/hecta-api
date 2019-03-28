const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');
const uri = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;

amqp.connect(uri, function (err, conn) {
  if (err) {
    throw err;
  }

  conn.createChannel(function (err, ch) {
    if (err) {
      throw err;
    }

    // ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: true});

    const message = {
      saleIds: ['5c9af51ea9a02917a980253a'],
      updateField: 'CLICK'
    };
    // console.log('send message', message);

    ch.sendToQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, new Buffer(JSON.stringify(message)));

    // ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: false});
  });
});