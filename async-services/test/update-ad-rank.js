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

    setInterval(() => {
      const message = {
        saleIds: ["5bf83512cf22155e210e6e7f", "5bf8351ccf22155e210e6e8a", "5bf83526cf22155e210e6e95"]
      };

      ch.sendToQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, new Buffer(JSON.stringify(message)));
    }, 1000);

    // ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: false});
  });
});