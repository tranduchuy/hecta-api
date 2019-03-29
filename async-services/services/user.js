const CDP_APIS = require('../../web/config/cdp-url-api.constant');
const {get, post} = require('../../web/utils/Request');
const moment = require('moment');
const log4js = require('log4js');
const logger = log4js.getLogger('Services');

const login = (account, cb) => {
  post(CDP_APIS.USER.LOGIN, {
    username: account.username.toString().trim(),
    password: account.password.toString().trim()
  })
    .then((response) => {
      return cb(null, response.data.meta.token);
    })
    .catch((err) => {
      return cb(err);
    })
};

const getDetailBalance = async (userId, token) => {
  const url = CDP_APIS.ADMIN.USER_INFO_BY_ID.replace(':id', userId);
  const response = await get(url, token);
  return response.data.entries[0].balance;
};

/**
 *
 * @param {{main1: number, main2: number, promo: number, credit: number, expiredAt: string, creditExpiredAt: string}} balanceInfo
 * @param {number} cpv
 * @returns {boolean}
 */
const isValidBalance = (balanceInfo, cpv) => {
  try {
    const isCreditExpired = isWalletExpired(balanceInfo.creditExpiredAt);
    const isPersonalExpired = isWalletExpired(balanceInfo.expiredAt);
    if (isCreditExpired && isPersonalExpired) {
      logger.info('UserService::isValidBalance::all wallet expired');
      return false;
    }

    if (!isPersonalExpired) {
      logger.info('UserService::isValidBalance. Personal wallet valid');
      const total = balanceInfo.main1 + balanceInfo.main2 + balanceInfo.promo;
      return total >= cpv;
    }

    if (!isCreditExpired) {
      logger.info('UserService::isValidBalance. Credit wallet valid');
      return balanceInfo.credit >= cpv;
    }

    const total = balanceInfo.main1 + balanceInfo.main2 + balanceInfo.promo + balanceInfo.credit;
    return total >= cpv;
  } catch (e) {
    logger.error('UserService::isValidBalance::error', e);
    return true;
  }
};

/**
 *
 * @param {string} expiredAt
 * @returns {boolean}
 */
const isWalletExpired = (expiredAt) => {
  const date = moment(expiredAt);
  return moment().isAfter(date);
};


module.exports = {
  login,
  getDetailBalance,
  isValidBalance
};