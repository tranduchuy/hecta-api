const config = require('config');
const adminAccount = config.get('adminAccount');
const RABBIT_MQ_CHANNELS = require('../../web/config/rabbit-mq-channels');
const async = require('async');
const {get, post} = require('../../web/utils/Request');
const CDP_APIS = require('../../web/config/cdp-url-api.constant');
const UserService = require('../services/user');
const RabbitMQService = require('../services/rabbitmq');
const log4js = require('log4js');
const logger = log4js.getLogger('Tasks');

// models
const SaleModel = require('../../web/models/SaleModel');
const PostModel = require('../../web/models/PostModel');
let token = '';

/**
 *
 * @param {{saleIds: string[], updateField: string}} params
 * @returns {Promise<void>}
 */
const runProcess = async (params) => {
  logger.info('UpdateAdRank::runProcess::called with params', JSON.stringify(params));
  const saleIds = params.saleIds;
  saleIds.forEach(async (saleId) => {
    await runProcessForOneSale(saleId, params.updateField);
  });
};

/**
 *
 * @param {string} saleId
 * @param {number} updateField
 * @returns {Promise<void>}
 */
const runProcessForOneSale = async (saleId, updateField) => {
  try {
    const sale = await getDetailSale(saleId);
    if (!sale) {
      logger.error('UpdateAdRank::runProcessForOneSale::error. Sale not found. Sale id', saleId);
      return;
    }

    // init default when sale is too old, not include fields: ['view', 'impression', 'click', 'cpv', 'ctr', 'adRank', 'budgetPerDay']
    initDefaultAdInfo(sale);

    // get post of sale
    const post = await getDetailPost(saleId);
    if (!post || !post.user) {
      logger.error('UpdateAdRank::runProcessForOneSale::error. Post not found or not determine user id. Post: ', JSON.stringify(post || {}));
      return;
    }

    // get user balance
    const userBalance = await UserService.getDetailBalance(post.user, token);

    // update sale ad info
    switch (updateField) {
      case global.AD_STAT_IMPRESSION:
        sale.impression++;
        break;
      case global.AD_STAT_CLICK:
        sale.click++;
        break;
    }

    sale.ctr = calculateCTR(sale.impression, sale.click);
    sale.adRank = calculateAdRank(sale.ctr, sale.cpv);
    sale.isValidBalance = UserService.isValidBalance(userBalance, sale.cpv);
    await sale.save();
    logger.info('UpdateAdRank::runProcessForOneSale::success. Update adRank successfully for sale', saleId);
  } catch (e) {
    logger.error(`UpdateAdRank::runProcessForOneSale::error. Cannot update Sale id: ${saleId}`, e);
  }
};

const getDetailSale = async (saleId) => {
  return await SaleModel.findOne({_id: saleId});
};

const getDetailPost = async (saleId) => {
  return await PostModel.findOne({contentId: saleId});
};

const calculateCTR = (impr, click) => {
  if (impr === 0) {
    return 0;
  }

  return Math.round(1000 * click / impr) / 1000;
};

const calculateAdRank = (ctr, cpv) => {
  return (ctr + 1) * cpv;
};

const initDefaultAdInfo = (sale) => {
  ['view', 'impression', 'click', 'cpv', 'ctr', 'adRank', 'budgetPerDay'].forEach(column => {
    sale[column] = sale[column] || 0;
  });
};

module.exports = () => {
  logger.info('========================================');
  logger.info('UpdateAdRank::called');
  async.parallel([
    (cb) => {
      UserService.login(adminAccount, cb);
    },
    (cb) => {
      RabbitMQService.connect(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, cb);
    }
  ], (err, results) => {
    if (err) {
      throw err;
    }

    token = results[0];
    const channel = results[1][0];

    /*
    * {
    *   salesIds: [],
    *   updateField: 1 | 2 | 3
    * }
    *
    * */
    channel.consume(RABBIT_MQ_CHANNELS.UPDATE_AD_RANK_OF_SALES, async (msg) => {
      try {
        const params = JSON.parse(msg.content);
        if (params.saleIds && params.saleIds.length !== 0) {
          await runProcess(params);
        }
      } catch (e) {
        logger.error('UpdateAdRank::error', e);
      }
    }, {noAck: true});
  });
};