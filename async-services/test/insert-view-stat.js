const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const RABBIT_MQ_CHANNELS = require('../../web/config/rabbit-mq-channels');
const uri = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;

amqp.connect(uri, function (err, conn) {
  if (err) {
    throw err;
  }

  conn.createChannel(function (err, ch) {
    if (err) {
      throw err;
    }

    const message = {
      logData: {
        utmSource: '',
        utmCampaign: '',
        utmMedium: '',
        browser: '',
        referrer: '',
        version: '',
        device: '',
        os: ''
      },
      saleIds: ['5c9af51ea9a02917a980253a'],
      type: 'VIEW'
    };
    ch.sendToQueue(RABBIT_MQ_CHANNELS.INSERT_VIEW_STAT_WHEN_VIEW_SALE, new Buffer(JSON.stringify(message)));

    // ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: false});
  });
});