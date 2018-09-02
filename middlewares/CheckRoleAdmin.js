/**
 * Example:
 * router.get('xxx', require('./middlewares/CheckRoleAdmin'), function(req, res, next) {...})
 */

module.exports = async function (req, res, next) {
  if (req.user.role != global.USER_ROLE_ADMIN) {
    return res.json({
      status: 0,
      message: ['Permission denied'],
      data: {}
    });
  }

  return next();
}