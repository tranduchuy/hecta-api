const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');
const uri = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;
const {get} = require('../../web/utils/Request');

// models
const SaleModel = require('../../web/models/SaleModel');
const PostModel = require('../../web/models/PostModel');

amqp.connect(uri, function (err, conn) {
  if (err) {
    throw err;
  }
  console.log('Connect to RabbitMQ successfully');

  conn.createChannel(function (err, ch) {
    if (err) {
      throw err;
    }

    ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: true});
    ch.consume(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, async (msg) => {
      try {
        const params = JSON.parse(msg);
        await runProcess(params);
        ch.ack(msg);
      } catch (e) {
        ch.ack(msg);
        console.error(e.message);
      }
    }, {noAck: true});
  });
});

const runProcess = async (params) => {
  const saleIds = params.saleIds;
  saleIds.forEach(async (saleId) => {
    await runProcessForOneSale(saleId);
  });
};

const runProcessForOneSale = async (saleId) => {
  try {
    const sale = await getDetailSale(saleId);
    if (!sale) {
      // TODO: should confirm about case not found info. Should update adRank to be 0 or not
      return;
    }

    // init default when sale is too old, not include fields: ['view', 'impression', 'click', 'cpv', 'ctr', 'adRank', 'budgetPerDay']
    initDefaultAdInfo(sale);

    // get post of sale
    const post = await getDetailPost(saleId);
    if (post || !post.user) {
      // TODO: should confirm about case not found info. Should update adRank to be 0 or not
      return;
    }

    // get user balance
    const userBalance = await getDetailBalance(post.user);


  } catch (e) {
    console.error(`runProcessForOneSale. sale id: ${saleId}`, e);
    return;
  }
};

const getDetailSale = async (saleId) => {
  return await SaleModel.findOne({_id: saleId});
};
const getDetailPost = async (saleId) => {
  return await PostModel.findOne({contentId: saleId});
};

const getDetailBalance = async (userId) => {
  return
};

const calculateCTR = (impr, click) => {
};

const initDefaultAdInfo = (sale) => {
  ['view', 'impression', 'click', 'cpv', 'ctr', 'adRank', 'budgetPerDay'].forEach(column => {
    sale[column] = sale[column] || 0;
  });
};