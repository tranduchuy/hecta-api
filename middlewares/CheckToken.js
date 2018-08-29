var TokenModel = require('../models/TokenModel');
var UserModel = require('../models/UserModel');

var urlToPassCheckingToken = [
  '/api/v1/users/login',
  '/api/v1/users/register',
  '/api/v1/users/confirm',
  '/api/v1/users/confirm/resend',
  '/admin/v1/admins/login'
];

module.exports = async function (req, res, next) {
  if (urlToPassCheckingToken.indexOf(req.path) !== -1) {
    return next();
  }

  var token = req.headers.access_token || req.query.access_token || req.body.access_token;

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

  var user = await UserModel.findOne({_id: accessToken.user});
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