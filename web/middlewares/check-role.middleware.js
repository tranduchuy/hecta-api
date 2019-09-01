const HttpCode = require('../config/http-code');

module.exports = (roles) => {
  return async (req, res, next) => {
    if (roles.indexOf(req.user.role) !== -1) {
      return res.json({
        status: HttpCode.ERROR,
        message: ['Permission denied'],
        data: {}
      });
    }

    return next();
  }
};
