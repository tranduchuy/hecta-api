const EmailValidator = require("email-validator");
const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');
const TokenModel = require('../models/TokenModel');
const ChildModel = require('../models/ChildModel');
const AccountModel = require('../models/AccountModel');
const TransactionHistoryModel = require('../models/TransactionHistoryModel');
const Mailer = require('../utils/Mailer');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const randomstring = require("randomstring");
const HTTP_CODE = require('../config/http-code');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const NotifyController = require('./NotifyController');
const NotifyContent = require('../config/notify-content');
const Socket = require('../utils/Socket');
const SocketEvents = require('../config/socket-event');
const NotifyTypes = require('../config/notify-type');
const ImageService = require('../services/ImageService');
const {get, post, put, del} = require('../utils/Request');
const CDP_APIS = require('../config/cdp-url-api.constant');

const forgetPassword = async (req, res, next) => {
  logger.info('UserController::forgetPassword is called');

  try {

    get(`${CDP_APIS.USER.FORGET_PASSWORD}?email=${req.body.email || ''}`)
      .then((r) => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: ['Hệ thống đã gửi 1 link đổi mật khẩu đến email'],
          data: {}
        });
      })
      .catch(err => {
        return res.json(err);
      });
  } catch (e) {
    logger.error('UserController::forgetPassword error: ', e);
    return next(e);
  }
};

const resetPassword = async (req, res, next) => {
  logger.info('UserController::resetPassword is called');
  const resetToken = (req.body['resetToken'] || '').toString();
  const password = (req.body.password || '').toString();

  try {
    post(CDP_APIS.USER.RESET_PASSWORD, {
      token: resetToken,
      password,
      confirmedPassword: password
    })
      .then(r => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: ['Đổi mật khẩu thành công. Vui lòng đăng nhập lại!'],
          data: {}
        });
      })
      .catch(err => {
        return next(err);
      });
    // const user = await UserModel.findOne({resetPasswordToken: resetToken});
    // if (!user) {
    //   return res.json({
    //     status: HTTP_CODE.ERROR,
    //     message: ['Token đổi mật khẩu không hợp lệ'],
    //     data: {}
    //   });
    // }
    //
    // user.resetPasswordToken = ''; // xoá reset token
    // user.hash_password = bcrypt.hashSync(password, 10);
    // await user.save();
    //
    // logger.info('UserController::resetPassword update password successfully', user.email);
    // return res.json({
    //   status: HTTP_CODE.SUCCESS,
    //   message: ['Đổi mật khẩu thành công. Vui lòng đăng nhập lại!'],
    //   data: {}
    // });
  } catch (e) {
    logger.error('UserController::resetPassword error', e);
    return next(e);
  }
};

const balance = async (req, res, next) => {
  logger.info('UserController::balance is called');
  try {
    const user = req.user;
    let account = await AccountModel.findOne({owner: user._id});

    if (!account) {
      account = new AccountModel({owner: user._id});
      account = await account.save();
    }

    const accountInfo = {
      main: account.main,
      promo: account.promo
    };

    if (user.type === global.USER_TYPE_COMPANY) {
      let creditTransferred = 0;
      const children = await ChildModel.find({companyId: user._id});

      if (children && children.length > 0) {
        children.forEach(child => {
          creditTransferred += (child.credit - child.creditUsed);
        });
      }

      accountInfo.creditTransferred = creditTransferred;
    }

    if (user.type === global.USER_TYPE_PERSONAL) {
      const child = await ChildModel.find({personalId: user._id, status: global.STATUS.CHILD_ACCEPTED});
      if (child) {
        accountInfo.credit = child.credit;
        accountInfo.creditUsed = child.creditUsed;
      }
    }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: accountInfo,
      message: 'request success'
    });
  } catch (e) {
    logger.error('UserController::balance::error', e);
    return next(e);
  }
};

const childDetail = async (req, res, next) => {
  logger.info('UserController::childDetail is called with child id', req.params.id);
  try {
    const childId = req.params.id;
    const url = `${CDP_APIS.RELATION_SHIP.CHILD_DETAIL}?childId=${childId}`;
    get(url, req.user.token)
      .then(r => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: r.data.entries[0] || {},
          message: 'Success'
        })
      })
      .catch(e => {
        logger.error('UserController::childDetail::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('UserController::childDetail::error', e);
    return next(e);
  }
};

const registerChild = async (req, res, next) => {
  logger.info('UserController::registerChild is called');

  try {
    const {
      username, email, password, phone, name, confirmedPassword,
      birthday, gender, city, district, ward, type
    } = req.body;

    const postData = {
      username, email, password, phone, name, confirmedPassword,
      birthday, gender, city, district, ward, type
    };

    post(CDP_APIS.RELATION_SHIP.ADD_NEW_CHILD, postData, req.user.token)
      .then(async r => {
        const newRelation = r.data.entries[0];
        // create notify
        const notifyParam = {
          fromUserId: newRelation.parentId,
          toUserId: newRelation.childId,
          title: NotifyContent.RequestChild.Title,
          content: NotifyContent.RequestChild.Content,
          type: NotifyTypes.PARENT_CHILD.REQUEST,
          params: {
            requestId: newRelation.id
          }
        };

        await NotifyController.createNotify(notifyParam);

        // send Socket
        const socketContents = {...notifyParam, toUserIds: [newRelation.childId]};
        delete socketContents.toUserId;
        Socket.broadcast(SocketEvents.NOTIFY, socketContents);
        logger.info(`UserController::registerChild::success. relation id ${newRelation.id}`);

        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: newRelation,
          message: 'Success'
        });
      })
      .catch(e => {
        logger.error('UserController::registerChild::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('UserController::registerChild::error', e);
    return next(e);
  }
};

const confirm = async (req, res, next) => {
  logger.info('UserController::confirm is called');
  const token = req.body.token;

  try {
    get(`${CDP_APIS.USER.CONFIRM_EMAIL}?token=${token}`)
      .then(r => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: {},
          message: 'Success'
        });
      })
      .catch(err => {
        return next(err);
      })
    // if (!token || token.length < 30) {
    //   return res.json({
    //     status: HTTP_CODE.BAD_REQUEST,
    //     data: {},
    //     message: 'Invalid token'
    //   });
    // }
    //
    // const user = await UserModel.findOne({confirmToken: token});
    //
    // if (!user) {
    //   return res.json({
    //     status: HTTP_CODE.ERROR,
    //     data: {},
    //     message: 'Token not found'
    //   });
    // }
    //
    // user.status = global.STATUS.ACTIVE;
    //
    // await user.save();
    // return res.json({
    //   status: HTTP_CODE.SUCCESS,
    //   data: {},
    //   message: 'Success'
    // });
  } catch (e) {
    logger.error('UserController::confirm::error', e);
    return next(e);
  }
};

const register = async (req, res, next) => {
  logger.info('UserController::register is called');

  let {
    username, email, password, phone, name,
    birth, gender, city, district, ward, type,
    retypePassword
  } = req.body;

  let birthday = birth;

  if (birthday) {
    birthday = new Date(birthday);
  }

  const data = {
    username, email, password, phone, name,
    birthday, gender, city, district, ward, type,
    confirmedPassword: retypePassword
  };

  try {
    post(CDP_APIS.USER.REGISTER, data)
      .then(() => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: {}
        });
      })
      .catch(err => {
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::register::error', e);
    return next(e);
  }
};

const creditShare = async (req, res, next) => {
  logger.info('UserController::creditShare is called');
  try {
    let {amount, note, id} = req.body;
    const user = req.user;
    const person = await UserModel.findOne({_id: id});
    if (!person) {
      return res.json({
        status: 0,
        data: {},
        message: 'person is not exist'
      });
    }

    if (person.type !== global.USER_TYPE_PERSONAL) {
      return res.json({
        status: HTTP_CODE.ERROR,
        data: {},
        message: 'Person invalid !'
      });
    }

    let child = await ChildModel.findOne({
      companyId: user._id,
      personalId: person._id,
      status: global.STATUS.CHILD_ACCEPTED
    });

    if (!child) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'relation in valid'
      });
    }

    if (isNaN(amount)) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {amount: amount},
        message: 'Amount is invalid'
      });
    }

    amount = parseInt(amount, 0);

    if (amount < 0) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {amount: amount},
        message: 'Amount is invalid'
      });
    }

    let sourceAccount = await AccountModel.findOne({owner: user._id});

    if (!sourceAccount) {
      sourceAccount = new AccountModel({
        owner: user._id
      });

      sourceAccount = await sourceAccount.save();
    }

    if (amount > 0) {
      let sharedCredit = 0;
      const sharedChildren = await ChildModel.find({companyId: user._id});

      if (sharedChildren) {
        sharedChildren.forEach(sharedChild => {
          sharedCredit += sharedChild.credit;
        });
      }

      if (sourceAccount.main - sharedCredit < amount) {
        return res.json({
          status: HTTP_CODE.ERROR,
          data: {},
          message: 'account not enough'
        });
      }
    } else {
      if (child.credit - child.creditUsed < amount) {
        return res.json({
          status: HTTP_CODE.ERROR,
          data: {},
          message: 'credit left not enough'
        });
      }
    }

    const accountChild = await AccountModel({owner: child.personalId});
    const beforeUser = {
      credit: child.credit,
      main: accountChild ? accountChild.main : 0,
      promo: accountChild ? accountChild.promo : 0
    };
    const beforeParent = {
      credit: 0,
      main: sourceAccount.main,
      promo: sourceAccount.promo
    };

    child.credit += amount;
    child.creditHistory.push({date: Date.now(), amount: amount, note: note});

    sourceAccount.main -= amount;

    await sourceAccount.save();

    const afterUser = {
      credit: child.credit,
      main: accountChild ? accountChild.main : 0,
      promo: accountChild ? accountChild.promo : 0
    };

    const afterParent = {
      credit: 0,
      main: sourceAccount.main,
      promo: sourceAccount.promo
    };

    await TransactionHistoryModel.addTransaction(child.personalId, undefined, amount, note, child.companyId, global.TRANSACTION_TYPE_RECEIVE_CREDIT, beforeUser, afterUser);
    await TransactionHistoryModel.addTransaction(child.companyId, undefined, amount, note, child.personalId, global.TRANSACTION_TYPE_SHARE_CREDIT, beforeParent, afterParent);
    await child.save();

    // notify
    const notifyParams = {
      fromUserId: child.companyId,
      toUserId: child.personalId,
      title: NotifyContent.CreditShare.Title,
      content: NotifyContent.CreditShare.Content,
      type: NotifyTypes.CHANGE_TRANSACTION,
      params: {
        before: beforeUser,
        after: afterUser
      }
    };
    NotifyController.createNotify(notifyParams);

    // send Socket
    notifyParams.toUserIds = [notifyParams.toUserId];
    delete notifyParams.toUserId;
    Socket.broadcast(SocketEvents.NOTIFY, notifyParams);


    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: child,
      message: 'Request success'
    });
  } catch (e) {
    logger.error('UserController::creditShare::error', e);
    return next(e);
  }
};

const childRemove = async (req, res, next) => {
  logger.info('UserController::childRemove is called');
  try {
    const id = req.params.id;
    const user = req.user;
    if (user.type === global.USER_TYPE_COMPANY && !ObjectId.isValid(id)) {
      logger.error('UserController::childRemove::error. Permission denied', user);
      return next(new Error('Permission denied'));
    }

    let child = undefined;
    if (user.type === global.USER_TYPE_COMPANY) {
      child = await ChildModel.findOne({
        companyId: user._id,
        personalId: id,
        status: global.STATUS.CHILD_ACCEPTED
      });
    }

    if (user.type === global.USER_TYPE_PERSONAL) {
      child = await ChildModel.findOne({
        personalId: user._id,
        status: global.STATUS.CHILD_ACCEPTED
      });
    }

    if (!child) {
      return next(new Error('Relation not found'));
    }

    let parentAccount = await AccountModel.findOne({owner: child.companyId});
    if (!parentAccount) {
      parentAccount = new AccountModel({
        owner: child.companyId,
        main: 0
      });
    }

    let parentBefore = {
      main: parentAccount.main,
      promo: parentAccount.promo,
      credit: 0
    };

    let childAccount = await AccountModel.findOne({owner: child.personalId});
    if (!childAccount) {
      childAccount = new AccountModel({
        owner: child.personalId,
        main: 0
      });
      await childAccount.save();
    }

    const childBefore = {
      main: childAccount.main,
      promo: childAccount.promo,
      credit: child.credit
    };

    parentAccount.main += child.credit;
    child.status = global.STATUS.CHILD_NONE;
    child.credit = 0;

    const parentAfter = {
      main: parentAccount.main,
      promo: parentAccount.promo,
      credit: 0
    };
    const childAfter = {
      main: childAccount.main,
      promo: childAccount.promo,
      credit: 0
    };
    await parentAccount.save();
    await child.save();

    await TransactionHistoryModel.addTransaction(
      child.companyId,
      undefined,
      childBefore.credit,
      '',
      child.personalId,
      global.TRANSACTION_TYPE_TAKE_BACK_MONEY,
      parentBefore,
      parentAfter);

    await TransactionHistoryModel.addTransaction(
      child.personalId,
      undefined,
      childBefore.credit,
      '',
      child.companyId,
      global.TRANSACTION_TYPE_GIVE_MONEY_BACK,
      childBefore,
      childAfter);

    // notify
    const notifyParams = {
      fromUserId: child.companyId,
      toUserId: child.personalId,
      title: NotifyContent.ReturnMoneyToCompany.Title,
      content: NotifyContent.ReturnMoneyToCompany.Content,
      type: NotifyTypes.PARENT_CHILD.REMOVE,
      params: {
        requestId: child._id
      }
    };
    NotifyController.createNotify(notifyParams);

    // send socket
    notifyParams.toUserIds = [notifyParams.toUserId];
    delete notifyParams.toUserId;
    Socket.broadcast(SocketEvents.NOTIFY, notifyParams);

    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: child,
      message: 'Success'
    });
  } catch (e) {
    logger.error('UserController::childRemove::error', e);
    return next(e);
  }
};

const childResponse = async (req, res, next) => {
  logger.info('UserController::childResponse is called');
  try {
    const postData = {
      relationId: parseInt(req.params.id),
      status: req.body.status
    };

    post(CDP_APIS.RELATION_SHIP.CHILD_REPLY_REQUEST, postData, req.user.token)
      .then(async r => {
        const relation = r.data.entries[0];
        const {Title, Content} = req.body.status === global.STATUS.CHILD_ACCEPTED ?
          NotifyContent.ResponseChildStatusAccepted :
          NotifyContent.ResponseChildStatusRejected;

        const notifyParam = {
          fromUserId: relation.childId,
          toUserId: relation.parentId,
          title: Title,
          content: Content,
          type: NotifyTypes.PARENT_CHILD.RESPONSE,
          params: {
            status: relation.status// show status of child's response
          }
        };
        await NotifyController.createNotify(notifyParam);

        const socketContents = {...notifyParam, toUserIds: [relation.parentId]};
        delete socketContents.toUserId;
        Socket.broadcast(SocketEvents.NOTIFY, socketContents);
        logger.info(`UserController::childResponse::success. relation id ${relation.id}, status ${relation.status}`);

        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: relation,
          message: 'request success !'
        });
      })
      .catch(e => {
        logger.error('UserController::childResponse::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('UserController::childResponse::error', e);
    return next(e);
  }
};

const login = async (req, res, next) => {
  logger.info('UserController::login is called');
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

        user._id = user.id;
        user.gender = user.gender || null;
        user.city = user.city || null;
        user.district = user.district || null;
        user.ward = user.ward || null;
        user.birthday = user.birthday || null;
        user.balance.main = user.balance.main1;
        delete user.balance.main1;

        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: user
        });
      })
      .catch((err) => {
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

const resendConfirm = async (req, res, next) => {
  logger.info('UserController::resendConfirm is called');

  try {
    const email = req.body.email;

    get(`${CDP_APIS.USER.RESEND_CONFIRM_EMAIL}?email=${email}`)
      .then((r) => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: {},
          message: 'request success'
        });
      })
      .catch((err) => {
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::resendConfirm::error', e);
    return next(e);
  }
};

const update = async (req, res, next) => {
  logger.info('UserController::update::called');

  try {
    const user = req.user;
    let {password, name, phone, birthday, gender, city, district, ward, type, avatar, oldPassword} = req.body;
    const postData = {password, name, phone, birthday, gender, city, district, ward, type, avatar, oldPassword};
    ImageService.putUpdateImage([user.avatar], [avatar]);

    const apiUrl = CDP_APIS.USER.UPDATE_USER_INFO.replace(':id', req.user.id);
    put(apiUrl, postData, req.user.token)
      .then((r) => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: r.data.entries[0],
          message: 'Success'
        });
      })
      .catch(err => {
        logger.error('UserController::update::error', err);
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::update::error', e);
    return next(e);
  }
};

const childRequest = async (req, res, next) => {
  logger.info(`UserController::childRequest::called`);

  try {
    let id = req.params.id;
    const postData = {
      userId: parseInt(id)
    };
    logger.info(`UserController::childRequest call CDP api with user id: ${id}`);

    post(CDP_APIS.RELATION_SHIP.ADD_REGISTERED_CHILD, postData, req.user.token)
      .then(async r => {

        const notifyParam = {
          fromUserId: req.user.id,
          toUserId: parseInt(id),
          title: NotifyContent.RequestChild.Title,
          content: NotifyContent.RequestChild.Content,
          type: NotifyTypes.PARENT_CHILD.REQUEST,
          params: {
            requestId: r.data.entries[0].id
          }
        };
        await NotifyController.createNotify(notifyParam);

        const socketContents = {...notifyParam, toUserIds: [parseInt(id)]};
        delete socketContents.toUserId;
        Socket.broadcast(SocketEvents.NOTIFY, socketContents);
        logger.info('UserController::childRequest::success', JSON.stringify(r.data.entries[0]));

        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: r.data.entries[0]
        })
      })
      .catch(e => {
        logger.error('UserController::childRequest::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('UserController::childRequest::error', e);
    return next(e);
  }
};

const requestList = async (req, res, next) => {
  logger.info('UserController::requestList::called');

  try {
    get(CDP_APIS.RELATION_SHIP.REQUEST_LIST, req.user.token)
      .then((r) => {
        const results = r.data.entries.map(r => {
          r.parent = r.parentInfo;
          delete r.parentInfo;
          return r;
        });

        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: results
        })
      })
      .catch(err => {
        logger.error('UserController::requestList::error', err);

        return next(err);
      });

    // var token = req.headers.accesstoken;
    //
    // if (!token) {
    //   return res.json({
    //     status: 0,
    //     data: {},
    //     message: 'access token empty !'
    //   });
    // }
    //
    // var accessToken = await TokenModel.findOne({token: token});
    //
    // if (!accessToken) {
    //   return res.json({
    //     status: 0,
    //     data: {},
    //     message: 'access token invalid'
    //   });
    // }
    //
    //
    // var user = await UserModel.findOne({_id: accessToken.user});
    //
    // if (!user) {
    //
    //   return res.json({
    //     status: 0,
    //     data: {},
    //     message: 'user is not exist'
    //   });
    // }
    //
    // if (user.type != global.USER_TYPE_PERSONAL) {
    //   return res.json({
    //     status: 0,
    //     data: {},
    //     message: 'user does not have permission !'
    //   });
    // }
    //
    // var parrents = await ChildModel.find({personalId: user._id, status: global.STATUS.CHILD_WAITING});
    //
    // let results = await Promise.all(parrents.map(async parrent => {
    //
    //   let company = await UserModel.findOne({_id: parrent.companyId});
    //
    //
    //   return {
    //     id: parrent._id,
    //     parent: {
    //       id: company ? company._id : 'unknown',
    //       username: company ? company.username : 'unknown',
    //       email: company ? company.email : 'unknown',
    //       name: company ? company.name : 'unknown'
    //     },
    //     status: company.status
    //   };
    //
    //
    // }));
    //
    // return res.json({
    //   status: 1,
    //   data: results,
    //   message: 'request success !'
    // });

  } catch (e) {
    logger.error('UserController::requestList::error', err);

    return next(e);
  }
};

const childList = async (req, res, next) => {
  logger.info('UserController::childList::called');

  try {
    get(CDP_APIS.RELATION_SHIP.LIST_CHILD, req.user.token)
      .then((r) => {
        const childs = r.data.entries.map(child => {
          const accountInfo = {
            credit: child.credit,
            creditUsed: child.usedCredit
          };

          return {
            id: child.childId,
            username: child.childInfo.username,
            email: child.childInfo.email,
            name: child.childInfo.name,
            status: child.status,
            balance: accountInfo
          };
        });

        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: childs,
          message: 'request success !'
        });
      })
      .catch((err) => {
        return next(err)
      });

  } catch (e) {
    logger.error('UserController::childList::error', e);
    return next(e);
  }
};

const findUserByEmail = async (req, res, next) => {
  logger.info('UserController::findUserByEmail::called');

  try {
    const email = req.params.email;

    get(`${CDP_APIS.USER.FIND_USER_BY_EMAIL}?email=${email}`, req.user.token)
      .then(r => {
        return res.json({
          status: 1,
          data: r.data.entries[0],
          message: 'request success'
        });
      })
      .catch(err => {
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::findUserByEmail::error', e);
    return next(e);
  }
};

const highlight = async (req, res, next) => {
  logger.info('UserController::highlight::called');

  try {
    get(CDP_APIS.USER.HIGHLIGHT)
      .then((body) => {
        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: body.data.entries.map(u => {
            if (u.birthday) {
              u.birthday = new Date(u.birthday).getTime();
            }
          })
        })
      })
      .catch(err => {
        return next(err);
      });
  } catch (e) {
    return res.json({
      status: 0,
      data: {},
      message: 'unknown error : ' + e.message
    });
  }

};

const check = async (req, res, next) => {
  logger.info('UserController::check::called');
  const username = req.body.username || '';
  const email = req.body.email || '';

  try {
    get(`${CDP_APIS.USER.CHECK_DUP_USERNAME_EMAIL}?email=${email}&username=${username}`, req.user.token)
      .then(r => {
        if (r.data.meta.isDuplicate) {
          return res.json({
            status: HTTP_CODE.SUCCESS,
            data: false,
            message: (username ? 'username' : 'email') + ' duplicated'
          });
        }

        return res.json({
          status: HTTP_CODE.SUCCESS,
          data: true,
          message: (username ? 'username' : 'email') + ' available'
        });
      })
      .catch(err => {
        return next(err);
      });
  } catch (e) {
    logger.error('UserController::check:error', e);
    return next(e);
  }
};

const UserController = {
  login,
  balance,
  childDetail,
  registerChild,
  confirm,
  register,
  forgetPassword,
  resetPassword,
  creditShare,
  childRemove,
  childResponse,
  childRequest,
  requestList,
  childList,
  findUserByEmail,
  highlight,
  check,
  resendConfirm,
  update
};

module.exports = UserController;
