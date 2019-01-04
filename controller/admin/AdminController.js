const EmailValidator = require("email-validator");
const BCrypt = require('bcrypt');
const AccessToken = require('../../utils/AccessToken');
const TokenModel = require('../../models/TokenModel');
const UserModel = require('../../models/UserModel');
const BuyModel = require('../../models/BuyModel');
const SaleModel = require('../../models/SaleModel');
const NewsModel = require('../../models/NewsModel');
const ProjectModel = require('../../models/ProjectModel');
const HttpCode = require('../../config/http-code');
const _ = require('lodash');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');

const AdminController = {
  login: async function (req, res, next) {
    logger.info('AdminController::login is called');
    try {
      const {username, password} = req.body;
      
      if (!password || password.length < 6) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          message: 'Password is invalid',
          data: {}
        });
      }
      
      if (!username || username.length < 6) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          message: 'Username is invalid',
          data: {}
        });
      }
      
      let user = await UserModel.findOne({username: username});
      
      if (!user ||
        user.status !== global.STATUS.ACTIVE ||
        (user.role !== global.USER_ROLE_MASTER && user.role !== global.USER_ROLE_ADMIN) ||
        await !BCrypt.compareSync(password, user.hash_password)
      ) {
        return res.json({
          status: HttpCode.ERROR,
          message: 'Login fail',
          data: {}
        });
      }
      
      user = JSON.parse(JSON.stringify(user));
      user.token = AccessToken.generate(user._id);
      user.id = user._id;
      
      logger.info('AdminController::login::success');
      return res.json({
        status: HttpCode.SUCCESS,
        data: user,
        message: 'Login success'
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
        email, password, name, phone, birthday, gender, city, district, ward, avatar, oldPassword
      } = req.body;
      
      email = email.toLowerCase();
      
      if (email) {
        if (!EmailValidator.validate(email)) {
          return res.json({
            status: HttpCode.BAD_REQUEST,
            data: {},
            message: 'email : "' + email + '" is invalid'
          });
        }
        user.email = email;
      }
      
      if (password) {
        if (!password || password.length < 6) {
          return res.json({
            status: HttpCode.BAD_REQUEST,
            data: {},
            message: 'password : "' + password + '" is invalid'
          });
        }
        if (!oldPassword || await !BCrypt.compareSync(oldPassword, user.hash_password)) {
          return res.json({
            status: HttpCode.BAD_REQUEST,
            data: {},
            message: 'oldPassword : "' + oldPassword + '" is incorrect'
          });
        }
        user.password = BCrypt.hashSync(password, 10);
      }
      
      if (phone) {
        if (phone.length < 6) {
          return res.json({
            status: HttpCode.BAD_REQUEST,
            data: {},
            message: 'phone : "' + phone + '" is invalid'
          });
          
        }
        user.phone = phone;
      }
      
      if (name) {
        if (name.length < 3) {
          return res.json({
            status: HttpCode.BAD_REQUEST,
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
        status: HttpCode.SUCCESS,
        message: 'Update successfully',
        data: {}
      });
    }
    catch (e) {
      return res.json({
        status: HttpCode.ERROR,
        message: 'Unknown error : ' + e.message,
        data: {}
      });
    }
  },
  
  create: async function (req, res) {
    try {
      const master = req.user;
      
      if (master.role !== global.USER_ROLE_MASTER) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          message: 'Permission denied',
          data: {}
        });
      }
      var {
        username, email, password, phone, name
      } = req.body;
      
      email = email.toLowerCase();
      
      if (!EmailValidator.validate(email) ||
        !password ||
        password.length < 6 ||
        !phone || phone.length < 6 ||
        !name || name.length < 3 ||
        !username ||
        username.length < 6) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          data: {
            email,
            password,
            phone,
            name,
            username
          },
          message: 'Body invalid'
        });
      }
      
      let user = await UserModel.findOne({username: username});
      
      if (user) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          data: {},
          message: 'Username is duplicated'
        });
      }
      
      user = await UserModel.findOne({email: email});
      
      if (user) {
        return res.json({
          status: HttpCode.BAD_REQUEST,
          data: {},
          message: 'Email is duplicated'
        });
        
      }
      
      user = new UserModel();
      user.username = username;
      user.email = email;
      user.phone = phone;
      user.name = name;
      user.status = global.STATUS.ACTIVE;
      user.role = global.USER_ROLE_ADMIN;
      user.hash_password = BCrypt.hashSync(password, 10);
      
      await user.save();
      
      return res.json({
        status: HttpCode.SUCCESS,
        data: {},
        message: 'Request success !'
      });
    }
    catch (e) {
      return res.json({
        status: HttpCode.ERROR,
        data: {},
        message: 'unknown error : ' + e.message
      });
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
  
  list: async function (req, res) {
    
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
      
      var page = req.query.page;
      
      if (!page || page < 1) {
        page = 1;
      }
      
      var admins = await UserModel.find({role: global.USER_ROLE_ADMIN}).select({
        hash_password: 0,
        confirmToken: 0
      }).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
      
      let count = await UserModel.count({role: global.USER_ROLE_ADMIN});
      
      return res.json({
        status: 1,
        data: {
          items: admins,
          page: page,
          total: _.ceil(count / global.PAGE_SIZE)
        },
        message: 'request success '
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
        status: HttpCode.SUCCESS,
        message: 'Success',
        data: {}
      });
    } catch (e) {
      return res.json({
        status: HttpCode.ERROR,
        message: 'Delete error: ' + e.message,
        data: {}
      });
    }
  }
};

module.exports = AdminController;
