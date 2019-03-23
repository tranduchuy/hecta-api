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

module.exports = {
  login
};