const EmailValidator = require('email-validator');
const BCrypt = require('bcrypt');
const TokenModel = require('../../models/TokenModel');
const UserModel = require('../../models/UserModel');
const BuyModel = require('../../models/BuyModel');
const SaleModel = require('../../models/SaleModel');
const NewsModel = require('../../models/NewsModel');
const ProjectModel = require('../../models/ProjectModel');
const HTTP_CODE = require('../../config/http-code');
const _ = require('lodash');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const {post, get, del, put, convertObjectToQueryString} = require('../../utils/Request');
const CDP_APIS = require('../../config/cdp-url-api.constant');

const AdminController = {
  login: async function (req, res, next) {
    logger.info('AdminController::login is called');
    try {
      const {username, password} = req.body;
      if (!username || !password) {
        return next(new Error('Username and password are required'));
      }

      const data = {password};
      if (username.indexOf('@') !== -1) {
        data.email = username;
      } else {
        data.username = username;
      }

      post(CDP_APIS.USER.LOGIN, data)
        .then((r) => {
          const user = Object.assign(r.data.entries[0], {token: r.data.meta.token});

          if (![global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].some(r => r === user.role)) {
            logger.error('Admin/AdminController::login::error. Permission denied');
            return next(new Error('Permission denied'));
          }

          user._id = user.id;

          return res.json({
            status: HTTP_CODE.SUCCESS,
            message: 'Success',
            data: user
          });
        })
        .catch((err) => {
          return next(err)
        });
    } catch (e) {
      logger.info('AdminController::login::error', e);
      return next(e);
    }
  },

  update: async function (req, res, next) {
    try {
      const user = req.user;
      var {
        email, password, name, phone, birthday, gender,
        city, district, ward, avatar, oldPassword
      } = req.body;

      email = email.toLowerCase();

      if (email) {
        if (!EmailValidator.validate(email)) {
          return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            data: {},
            message: 'email : "' + email + '" is invalid'
          });
        }
        user.email = email;
      }

      if (password) {
        if (!password || password.length < 6) {
          return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            data: {},
            message: 'password : "' + password + '" is invalid'
          });
        }
        if (!oldPassword || await !BCrypt.compareSync(oldPassword, user.hash_password)) {
          return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            data: {},
            message: 'oldPassword : "' + oldPassword + '" is incorrect'
          });
        }
        user.password = BCrypt.hashSync(password, 10);
      }

      if (phone) {
        if (phone.length < 6) {
          return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            data: {},
            message: 'phone : "' + phone + '" is invalid'
          });

        }
        user.phone = phone;
      }

      if (name) {
        if (name.length < 3) {
          return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            data: {},
            message: 'name : "' + name + '" is invalid'
          });

        }
        user.name = name;
      }

      user.birthday = birthday || user.birthday;
      user.avatar = avatar || user.avatar;
      user.gender = gender || user.gender;
      user.city = city || user.city;
      user.district = district || user.district;
      user.ward = ward || user.ward;

      await user.save();

      return res.json({
        status: HTTP_CODE.SUCCESS,
        message: 'Update successfully',
        data: {}
      });
    }
    catch (e) {
      return res.json({
        status: HTTP_CODE.ERROR,
        message: 'Unknown error : ' + e.message,
        data: {}
      });
    }
  },

  create: async function (req, res, next) {
    logger.error('AdminController::create::called');

    try {
      const {
        username, email, password, confirmedPassword, phone, name
      } = req.body;
      const postData = {username, email, password, confirmedPassword, phone, name};

      post(CDP_APIS.USER.REGISTER_ADMIN, postData, req.user.token)
        .then((response) => {
          return res.json({
            status: HTTP_CODE.SUCCESS,
            data: {},
            message: 'Request success !'
          });
        })
        .catch(e => {
          logger.error('AdminController::create::error', e);
          return next(e);
        });
    } catch (e) {
      logger.error('AdminController::create::error', e);
      return next(e);
    }
  },

  status: async function (req, res) {
    try {
      var token = req.headers.accesstoken;

      var accessToken = await TokenModel.findOne({token: token});

      if (!accessToken) {
        return res.json({
          status: 0,
          data: {},
          message: 'access_token invalid'
        });
      }

      var master = await UserModel.findOne({_id: accessToken.user});


      if (!master || master.role != global.USER_ROLE_MASTER) {
        return res.json({
          status: 0,
          data: {},
          message: 'master invalid'
        });
      }


      var id = req.params.id;
      var admin = await UserModel.findOne({_id: id});

      if (!admin) {
        return res.json({
          status: 0,
          data: {},
          message: 'admin not found'
        });
      }

      var status = req.body.status;

      if (status != global.STATUS.ACTIVE && status != global.STATUS.BLOCKED) {
        return res.json({
          status: 0,
          data: {},
          message: 'status invalid'
        });
      }

      if (status == global.STATUS.BLOCKED) {
        await TokenModel.remove({user: id});
      }

      admin.status = status;
      await admin.save();

      return res.json({
        status: 1,
        data: {},
        message: 'request success !'
      });

    }
    catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
  },

  list: async function (req, res, next) {
    logger.info('AdminController::list::called');
    try {
      const queryStr = convertObjectToQueryString(req.query);
      const url = `${CDP_APIS.USER.LIST_ADMIN}?${queryStr}`;
      const limit = parseInt(req.query.limit || 10, 0);

      get(url, req.user.token)
        .then(r => {
          logger.info('AdminController::list::success');

          return res.json({
            status: HTTP_CODE.SUCCESS,
            message: '',
            data: {
              items: r.data.entries,
              page: req.query.page,
              total: _.ceil(r.data.meta.totalItems / limit),
              totalItems: r.data.meta.totalItems
            }
          });
        })
        .catch(err => {
          logger.error('AdminController::list:error', err);
          return next(err);
        });
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
  },

  removePost: async function (req, res) {
    let {type} = req.query;

    try {
      type = parseInt(type);

      switch (type) {
        case global.POST_TYPE_SALE:
          await SaleModel.remove({createdByType: global.CREATED_BY.CRAWL});
          break;
        case global.POST_TYPE_BUY:
          await BuyModel.remove({createdByType: global.CREATED_BY.CRAWL});
          break;
        case global.POST_TYPE_PROJECT:
          await ProjectModel.remove({createdByType: global.CREATED_BY.CRAWL});
          break;
        case global.POST_TYPE_NEWS:
          await NewsModel.remove({createdByType: global.CREATED_BY.CRAWL});
          break;
      }

      return res.json({
        status: HTTP_CODE.SUCCESS,
        message: 'Success',
        data: {}
      });
    } catch (e) {
      return res.json({
        status: HTTP_CODE.ERROR,
        message: 'Delete error: ' + e.message,
        data: {}
      });
    }
  }
};

module.exports = AdminController;
