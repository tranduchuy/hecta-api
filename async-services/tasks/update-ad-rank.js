const amqp = require('amqplib/callback_api');
const config = require('config');
const rabbitMQConfig = config.get('rabbitmq');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');
const uri = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;
const async = require('async');
const {get, post} = require('../../web/utils/Request');
const CDP_APIS = require('../../web/config/cdp-url-api.constant');

// models
const SaleModel = require('../../web/models/SaleModel');
const PostModel = require('../../web/models/PostModel');
let token = '';

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

    // update sale ad info
    sale.impression++;
    sale.ctr = calculateCTR(sale.impression, sale.click);
    sale.adRank = calculateAdRank(sale.ctr, sale.cpv);
    sale.isValidBalance = userBalance.main1 >= sale.cpv;
    await sale.save();


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
  const url = CDP_APIS.ADMIN.USER_INFO_BY_ID.replace(':id', userId);
  const response = await get(url, token);
  return response.data.entries[0].balance;
};

const calculateCTR = (impr, click) => {
  if (impr === 0) {
    return 0;
  }

  return Math.round(1000 * click / impr) / 1000;
};

const calculateAdRank = (ctr, cpv) => {
  return (ctr + 1) * cpv;
}

const initDefaultAdInfo = (sale) => {
  ['view', 'impression', 'click', 'cpv', 'ctr', 'adRank', 'budgetPerDay'].forEach(column => {
    sale[column] = sale[column] || 0;
  });
};

const loginCDP = (cb) => {
  const loginData = {
    username: "master",
    password: "123456"
  };
  console.log('api login', CDP_APIS.USER.LOGIN);
  post(CDP_APIS.USER.LOGIN, loginData)
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

      ch.assertQueue(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, {durable: true});
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

    /*
    * {
    *   salesIds: []
    * }
    *
    * */
    channel.consume(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, async (msg) => {
      console.log('message', msg);
      try {
        const params = JSON.parse(msg);

        if (params.salesId && params.salesId.length !== 0) {
          await runProcess(params);
        }
      } catch (e) {
        console.error(e.message);
      }
    }, {noAck: true});
  });
};