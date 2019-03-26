const adminAccount = config.get('adminAccount');
const RABBIT_MQ_CHANNELS = require('../config/rabbit-mq-channels');
const async = require('async');
const UserService = require('../services/user');
const RabbitMQService = require('../services/rabbitmq');
const HTTP_CODE = require('../../web/config/http-code');
const CDP_APIs = require('../../web/config/cdp-url-api.constant');

// models
const SaleModel = require('../../web/models/SaleModel');
const PostModel = require('../../web/models/PostModel');
const ViewStatModel = require('../../web/models/ViewStatModel');
let token = '';

/**
 *
 * @param {{logData: [Object], saleIds: [string]}} params
 */
const runProcess = async (params) => {
  await Promise.all(params.saleIds.map(async (saleId) => {
    await saveLogViewOfSale(saleId, params.logData);
  }));
};

/**
 *
 * @param {string} saleId
 * @param {{utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os}} logData
 */
const saveLogViewOfSale = async (saleId, logData) => {
  const sale = await getDetailSale(saleId);
  if (!sale) {
    return;
  }

  if (sale.paidForm !== global.PAID_FORM.VIEW) {
    return;
  }

  // get post of sale
  const post = await getDetailPost(saleId);
  if (post || !post.user) {
    return;
  }

  // get user balance
  const view = await saveViewLog(Object.assign({}, logData, {saleId}));

  try {
    const response = await purchase(post.user, saleId, view._id, sale.cpv);
    // TODO: api chưa trả mã hết tiền để có thể set sale.isValidBalance = false;
    if (response.status === HTTP_CODE.NOT_ENOUGH_MONEY) {
      sale.isValidBalance = false;
      await sale.sale();
    }
  } catch (e) {

  }
};

const getDetailSale = async (saleId) => {
  return await SaleModel.findOne({_id: saleId});
};

const getDetailPost = async (saleId) => {
  return await PostModel.findOne({contentId: saleId}).lean();
};

const purchase = async (userId, saleId, viewId, cost) => {
  const data = {
    userId,
    note: JSON.stringify({
      saleId,
      viewId
    }),
    cost
  };

  return await post(CDP_APIs.ADMIN.PURCHASE_BY_VIEW_SALE, data, token);
};

/**
 *
 * @param {{utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os, saleId}} logData
 * @returns {Promise<void>}
 */
const saveViewLog = async (logData) => {
  const view = new ViewStatModel();
  view.sale = logData.saleId;
  view.utmCampaign = logData.utmCampaign;
  view.utmMedium = logData.utmMedium;
  view.browser = logData.browser;
  view.referrer = logData.referrer;
  view.version = logData.version;
  view.device = logData.device;
  view.os = logData.os;
  view.createdAt = new Date();

  return await view.save();
};

module.exports = () => {
  async.parallel([
    (cb) => {
      UserService.login(adminAccount, cb);
    },
    RabbitMQService.connect
  ], (err, results) => {
    if (err) {
      throw err;
    }

    token = results[0];
    const channel = results[1];

    /*
    * msg:
    *   logData: {utmSource, utmCampaign, utmMedium, browser, referrer, version, device, os}
    *   saleIds: [string]
    * */
    channel.consume(RABBIT_MQ_CHANNELS.INSERT_VIEW_STAT_WHEN_VIEW_SALE, async (msg) => {
      try {
        const params = JSON.parse(msg);
        if (params.saleIds || params.saleIds.length !== 0) {
          await runProcess(params);
        }
      } catch (e) {
        console.error(e.message);
      }
    }, {noAck: true});
  });
};