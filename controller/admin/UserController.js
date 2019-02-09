const UserModel = require('../../models/UserModel');
const _ = require('lodash');
const TokenModel = require('../../models/TokenModel');
const ChildModel = require('../../models/ChildModel');
const AccountModel = require('../../models/AccountModel');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const HTTP_CODE = require('../../config/http-code');
const CDP_URL_APIS = require('../../config/cdp-url-api.constant');
const {get, post, put, del, convertObjectToQueryString} = require('../../utils/Request');

const changeUserType = async (req, res, next) => {
  var newType = req.body.type;
  logger.info('AdminUserController::changeUserType is called');

  try {
    var targetUser = await UserModel.findOne({_id: req.params.id});
    if (!targetUser) {
      logger.error('AdminUserController::changeUserType User not found: ' + req.params.id);

      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        message: ['User not found'],
        data: {}
      });
    }

    if (targetUser.status == global.STATUS.BLOCKED || targetUser.status == global.STATUS.DELETE) {
      logger.error('AdminUserController::changeUserType method not allow. User status is: ' + req.user.status);

      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        message: ['Method not allow'],
        data: {}
      });
    }

    if (targetUser.type == parseInt(newType, 0)) {
      logger.error('AdminUserController::changeUserType method not allow. Type not change: ' + newType);

      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        message: ['Type not change'],
        data: {}
      });
    }

    if (targetUser.type == global.USER_TYPE_COMPANY) {
      var children = await ChildModel.find({companyId: targetUser._id});

      if (children.length != 0) {
        logger.error('AdminUserController::changeUserType have children, can not change type: ' + newType);

        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          message: ['Have children. Cannot change type'],
          data: {}
        });
      }
    } else if (targetUser.type == global.USER_TYPE_PERSONAL) {
      var parent = await ChildModel.find({personalId: targetUser._id});

      if (parent.length != 0) {
        logger.error('AdminUserController::changeUserType have parents, can not change type: ' + newType);

        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          message: ['Have parents. Cannot change type'],
          data: {}
        });
      }
    }


    targetUser.type = parseInt(newType, 0);
    await targetUser.save();
  }
  catch (e) {
    logger.error("AdminUserController::changeUserType something error: " + JSON.stringify(e));

    return res.json({
      status: HTTP_CODE.BAD_REQUEST,
      message: [e],
      data: {}
    });
  }

  return res.json({
    status: HTTP_CODE.SUCCESS,
    message: ['Update user type successfully'],
    data: {}
  });
};

const list = async (req, res, next) => {
  logger.info('UserController::list::called');

  try {
    const queryStr = convertObjectToQueryString(req.query);
    const url = `${CDP_URL_APIS.USER.LIST_USER}?${queryStr}&role=3`;
    const limit = parseInt(req.query.limit || 10, 0);
    get(url, req.user.token)
      .then(r => {
        logger.info('UserController::list::success');
        const users = r.data.entries;
        users.forEach(user => {
          user.balance.main = user.balance.main1;
          if (user.type === global.USER_TYPE_COMPANY) {
            user.balance.creditTransferred = user.sharedCredit;
          } else if (user.type === global.USER_TYPE_PERSONAL) {
            user.balance.creditUsed = user.balance.usedCredit;
          }
        });

        // TODO: CDP chưa có thông tin cột này expirationDate trong bảng user

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
        logger.error('UserController::list:error', err);
        return next(err);
      });

    /*var page = req.query.page;
    var username = req.query.username;
    var email = req.query.email;
    var limit = req.query.limit;
    var type = req.query.type;


    if (!page || page < 0) {
      page = 0;
    }
    else {
      page = page * 1;
    }

    if (!limit || limit < 0) {
      limit = global.PAGE_SIZE;
    }
    else {
      limit = limit * 1;
    }

    var query = {role: {$nin: [global.USER_ROLE_ADMIN, global.USER_ROLE_MASTER]}};

    if (type == global.USER_TYPE_COMPANY || type == global.USER_TYPE_PERSONAL) {
      query.type = type;
    }

    if (username) {
      query.username = new RegExp(username, "i");

    }

    if (email) {
      query.email = new RegExp(email, "i");
    }

    var users = await UserModel.find(query).sort({date: -1}).skip((page - 1) * limit).limit(limit);
    let results = await Promise.all(users.map(async user => {

      var account = await AccountModel.findOne({owner: user._id});


      if (!account) {
        account = new AccountModel({owner: user._id});
        account = await account.save();
      }

      var accountInfo = {
        main: account.main,
        promo: account.promo

      };

      if (user.type == global.USER_TYPE_COMPANY) {
        var creditTransferred = 0;

        var children = await ChildModel.find({companyId: user._id});

        if (children && children.length > 0) {
          children.forEach(child => {
            creditTransferred += (child.credit - child.creditUsed);
          });
        }

        accountInfo.creditTransferred = creditTransferred;
      }

      if (user.type == global.USER_TYPE_PERSONAL) {

        var child = await ChildModel.find({personalId: user._id, status: global.STATUS.CHILD_ACCEPTED});

        if (child) {
          accountInfo.credit = child.credit;
          accountInfo.creditUsed = child.creditUsed;
        }

      }


      return {

        id: user._id,
        email: user.email,
        username: user.username,
        status: user.status,
        phone: user.phone,
        name: user.name,
        birthday: user.birthday,
        gender: user.gender,
        city: user.city,
        avatar: user.avatar,
        district: user.district,
        ward: user.ward,
        type: user.type,

        expirationDate: user.expirationDate,

        balance: accountInfo
      };


    }));


    let count = await UserModel.count(query);

    return res.json({
      status: 1,
      data: {
        items: results,
        page: page,
        total: _.ceil(count / limit)
      },
      message: 'request success '
    });*/

  }
  catch (e) {
    logger.error('UserController::list::error', e);
    return next(e);
  }
};

const update = async (req, res, next) => {
  logger.info('Admin/UserController::update::called');

  try {
    const urlApi = CDP_URL_APIS.USER.UPDATE_USER_INFO.replace(':id', req.params.id);
    let { name, phone, birthday, gender, city, district, ward, type, avatar } = req.body;
    const postData = { name, phone, birthday, gender, city, district, ward, type, avatar };

    put(urlApi, postData, req.user.token)
      .then(r => {
        logger.info('Admin/UserController::update::success');

        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: {},
          message: 'Success'
        });
      })
      .catch(e => {
        logger.error('Admin/UserController::update::error', e);

        return next(e);
      });
  } catch (e) {
    logger.error('Admin/UserController::update::error', e);
    return next(e);
  }
};

const UserController = {
  list,
  update,
  changeUserType
};

module.exports = UserController;
