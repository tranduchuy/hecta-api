var TokenModel = require('../models/TokenModel');
var UserModel = require('../models/UserModel');

var urlToPassCheckingToken = [
  '/api/v1/users/login',
  '/api/v1/users/register',
  '/api/v1/users/confirm',
  '/api/v1/users/confirm/resend',
  '/api/v1/users/check/',
  '/api/v1/users/highlight',

  '/api/v1/sales/add',
  '/api/v1/buys/add',

  '/api/v1/images/upload',
  '/api/v1/images/get', // /api/v1/images/get/{id}

  '/api/v1/search',
  '/api/v1/search/box',

  '/api/v1/tags/query',
  '/api/v1/tags/list',
  '/api/v1/tags/highlight',

  '/api/v1/news/highlight',
  '/api/v1/posts/latest',
  '/api/v1/posts/top/city',
  '/api/v1/news/latest',
  '/api/v1/projects/highlight',
  '/api/v1/vips/list',
  '/api/v1/vips/price',

  '/admin/v1/admins/login'
];

var checkSuitIgnoreUrl = function (path) {
  for(var i = 0; i < urlToPassCheckingToken.length; i++) {
    if (path.indexOf(urlToPassCheckingToken[i]) === 0) {
      return true; 
    }
  } 

  return false;
}

module.exports = async function (req, res, next) {
  if (checkSuitIgnoreUrl(req.path)) {
    return next();
  }

  // if (urlToPassCheckingToken.indexOf(req.path) !== -1) {
  //   return next();
  // }

  // TODO: var token = req.headers.access_token || req.query.access_token || req.body.access_token;

  var token = req.headers.access_token;

  if (token == null || typeof token === undefined) {
    return res.json({
      status: 0,
      message: 'Invalid token',
      data: {}
    });
  }

  var accessToken = await TokenModel.findOne({ token: token });

  if (!accessToken) {
    return res.json({
      status: 0,
      message: 'Invalid token',
      data: {}
    });
  }

  var user = await UserModel.findOne({ 
    _id: accessToken.user,
    status: global.STATUS.ACTIVE
  });

  if (!user) {
    return res.json({
      status: 0,
      message: 'Invalid token',
      data: {}
    });
  }

  req.user = user;
  return next();
}