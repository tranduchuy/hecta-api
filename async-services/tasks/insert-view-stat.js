const config = require('config');
const adminAccount = config.get('adminAccount');
const RABBIT_MQ_CHANNELS = require('../../web/config/rabbit-mq-channels');
const async = require('async');
const UserService = require('../services/user');
const RabbitMQService = require('../services/rabbitmq');
const HTTP_CODE = require('../../web/config/http-code');
const CDP_APIs = require('../../web/config/cdp-url-api.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Tasks');
const {get, post} = require('../../web/utils/Request');

// models
const SaleModel = require('../../web/models/SaleModel');
const PostModel = require('../../web/models/PostModel');
const AdStatHistoryModel = require('../../web/models/ad-stat-history');
let token = '';

/**
 *
 * @param {{logData: [Object], saleIds: [string]}} params
 */
const runProcess = async (params) => {
  logger.info('InsertViewState::runProcess::called. Params', JSON.stringify(params));
  await Promise.all(params.saleIds.map(async (saleId) => {
    await saveLogViewOfSale(saleId, params.logData, params.type);
  }));
};

/**
 *
 * @param {string} saleId
 * @param {{utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os}} logData
 * @param {string} type
 */
const saveLogViewOfSale = async (saleId, logData, type) => {
  if (!isValidViewType(type)) {
    logger.warn('InsertViewStat::saveLogViewOfSale. Wrong type', Object.assign({}, logData, {saleId}));
    return;
  }

  const sale = await getDetailSale(saleId);
  if (!sale) {
    logger.warn('InsertViewStat::saveLogViewOfSale::notFound. Sale not found, sale id', saleId);
    return;
  }

  // if (sale.paidForm !== global.PAID_FORM.VIEW) {
  //   logger.warn('InsertViewStat::saveLogViewOfSale::invalid params. Sale paid form is not PAID_FORM.VIEW', saleId);
  //   return;
  // }

  // get post of sale
  const post = await getDetailPost(saleId);
  if (!post || !post.user) { // méo quan tâm bài của khách vãng lai đăng
    logger.warn('InsertViewStat::saveLogViewOfSale::notFound. Post not found or not detect user of post. Sale id', saleId);
    return;
  }

  // get user balance
  const adStat = await saveAdLog(Object.assign({}, logData, {saleId, type}));

  // tính tiền với case VIEW
  if (type === global.AD_STAT_VIEW && sale.paidForm === global.PAID_FORM.VIEW) {
    try {
      const response = await purchase(post.user, saleId, adStat._id, sale.cpv);
      // TODO: api chưa trả mã hết tiền để có thể set sale.isValidBalance = false;
      if (response.status === HTTP_CODE.NOT_ENOUGH_MONEY) {
        sale.isValidBalance = false;
        await sale.sale();
      }
    } catch (e) {
      logger.error('InsertViewStat::saveLogViewOfSale::error', e);
    }
  }
};

const getDetailSale = async (saleId) => {
  return await SaleModel.findOne({_id: saleId});
};

const getDetailPost = async (saleId) => {
  return await PostModel.findOne({contentId: saleId}).lean();
};

const purchase = async (userId, saleId, adStatId, cost) => {
  const data = {
    userId,
    saleId,
    adStatId,
    cost
  };
  logger.info(`InsertViewStat::purchase::called. Call CDP url ${CDP_APIs.ADMIN.PURCHASE_BY_VIEW_SALE}`, JSON.stringify(data));

  return await post(CDP_APIs.ADMIN.PURCHASE_BY_VIEW_SALE, data, token);
};

/**
 *
 * @param {string} type
 * @returns {boolean}
 */
const isValidViewType = (type) => {
  return [
    global.AD_STAT_VIEW,
    global.AD_STAT_CLICK
  ].indexOf(type.toUpperCase()) !== -1;
};

/**
 *
 * @param {{utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os, type, saleId}} logData
 * @returns {Promise<void>}
 */
const saveAdLog = async (logData) => {
  const adStat = new AdStatHistoryModel();
  adStat.sale = logData.saleId;
  adStat.utmCampaign = logData.utmCampaign;
  adStat.utmMedium = logData.utmMedium;
  adStat.browser = logData.browser;
  adStat.referrer = logData.referrer;
  adStat.version = logData.version;
  adStat.device = logData.device;
  adStat.os = logData.os;
  adStat.type = logData.type.toUpperCase();
  adStat.createdAt = new Date();
  logger.info('InsertViewStat::saveAdLog::success. View data', JSON.stringify(adStat));

  return await adStat.save();
};

module.exports = () => {
  logger.info('========================================');
  logger.info('InsertViewState::called');
  async.parallel([
    (cb) => {
      UserService.login(adminAccount, cb);
    },
    (cb) => {
      RabbitMQService.connect(RABBIT_MQ_CHANNELS.INSERT_VIEW_STAT_WHEN_VIEW_SALE, cb);
    }
  ], (err, results) => {
    if (err) {
      throw err;
    }

    token = results[0];
    const channel = results[1][0];

    /*
    * msg:
    *   logData: {utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os}
    *   saleIds: [string],
    *   type: VIEW | CLICK
    * */
    channel.consume(RABBIT_MQ_CHANNELS.INSERT_VIEW_STAT_WHEN_VIEW_SALE, async (msg) => {
      try {
        const params = JSON.parse(msg.content);
        logger.info('InsertViewState::Recieve message', params);
        if (params.saleIds || params.saleIds.length !== 0) {
          await runProcess(params);
          logger.info('InsertViewState::finished');
        }
      } catch (e) {
        logger.error('InsertViewState::error', e);
      }
    }, {noAck: true});
  });
};