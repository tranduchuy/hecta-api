const CDP_APIS = require('../../web/config/cdp-url-api.constant');
const {post} = require('../../web/utils/Request');

const login = (account, cb) => {
  post(CDP_APIS.USER.LOGIN, account)
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


module.exports = {
  login,
  getDetailBalance
};