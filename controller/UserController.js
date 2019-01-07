const EmailValidator = require("email-validator");
const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');
const AccessToken = require('../utils/AccessToken');
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
const {get, post} = require('../utils/Request');
const CDP_APIS = require('../config/cdp-url-api.constant');


const forgetPassword = async (req, res, next) => {
  logger.info('UserController::forgetPassword is called');
  const email = (req.body.email || '').toString();
  
  if (email === '') {
    return res.json({
      status: HTTP_CODE.ERROR,
      message: ['Vui lòng nhập email'],
      data: {}
    });
  }
  
  try {
    const user = await UserModel.findOne({email: email});
    
    if (!user) {
      return res.json({
        status: HTTP_CODE.ERROR,
        message: ['Không tìm thấy người dùng!'],
        data: {}
      });
    }
    
    user.resetPasswordToken = randomstring.generate(30) + new Date().getTime();
    // tạo mật khẩu mới bất kì, để tránh trong lúc đang reset mật khẩu, ko có ai xài được nữa
    user.hash_password = bcrypt.hashSync(randomstring.generate(10), 10);
    user.save();
    
    // xoá tất cả các token của user này
    await TokenModel
      .find({user: user._id})
      .remove();
    
    logger.info('UserController::forgetPassword Remove all token of user', user.email);
    
    Mailer.sendEmailResetPassword(user.email, user.resetPasswordToken, function (err) {
      if (err) {
        logger.error('UserController::forgetPassword cannot send mail: ', err);
        return next(err);
      }
      
      return res.json({
        status: HTTP_CODE.SUCCESS,
        message: ['Hệ thống đã gửi 1 link đổi mật khẩu đến email'],
        data: {}
      });
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
  
  if (resetToken === '') {
    return res.json({
      status: HTTP_CODE.ERROR,
      message: ['Token đổi mật khẩu không hợp lệ'],
      data: {}
    });
  }
  
  if (password.length < 6) {
    return res.json({
      status: HTTP_CODE.ERROR,
      message: ['Mật khẩu quá ngắn'],
      data: {}
    });
  }
  
  try {
    const user = await UserModel.findOne({resetPasswordToken: resetToken});
    if (!user) {
      return res.json({
        status: HTTP_CODE.ERROR,
        message: ['Token đổi mật khẩu không hợp lệ'],
        data: {}
      });
    }
    
    user.resetPasswordToken = ''; // xoá reset token
    user.hash_password = bcrypt.hashSync(password, 10);
    await user.save();
    
    logger.info('UserController::resetPassword update password successfully', user.email);
    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: ['Đổi mật khẩu thành công. Vui lòng đăng nhập lại!'],
      data: {}
    });
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
    const person = await UserModel.findOne({_id: childId});
    if (!person) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'User is not exist'
      });
    }
    
    if (person.type !== global.USER_TYPE_PERSONAL) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'Invalid child account'
      });
    }
    
    const child = await ChildModel.findOne({
      companyId: req.user._id,
      personalId: person._id,
      status: global.STATUS.CHILD_ACCEPTED
    });
    
    if (!child) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'Invalid relationship'
      });
    }
    
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: {
        username: person.username,
        id: person._id,
        name: person.name,
        phone: person.phone,
        email: person.email
      },
      message: 'Success'
    });
  } catch (e) {
    logger.error('UserController::childDetail::error', e);
    return next(e);
  }
};

const registerChild = async (req, res, next) => {
  logger.info('UserController::registerChild is called');
  try {
    var {
      username, email, password, phone, name,
      birthday, gender, city, district, ward, type
    } = req.body;
    const parent = req.user;
    
    if (parent.type !== global.USER_TYPE_COMPANY) {
      const msg = 'Permission denied. Parent type: ' + parent.type;
      logger.error(msg);
      return next(new Error(msg));
    }
    
    email = email.toLowerCase();
    
    if (!EmailValidator.validate(email)) {
      return next(new Error('Invalid email'));
    }
    
    if (!password || password.length < 6) {
      return next(new Error('Invalid password'));
    }
    
    if (!phone || phone.length < 6) {
      return next(new Error('Invalid phone'));
    }
    
    if (!name || name.length < 3) {
      return next(new Error('Invalid name'));
    }
    
    if (type !== global.USER_TYPE_PERSONAL && type !== global.USER_TYPE_COMPANY) {
      return next(new Error('Invalid type'));
    }
    
    if (!username || username.length < 6) {
      return next(new Error('Invalid username'));
    }
    
    let user = await UserModel.findOne({username});
    
    if (user) {
      const msg = 'Duplicated username';
      logger.error('UserController::registerChild::error. ' + msg);
      return next(new Error(msg));
    }
    
    user = new UserModel();
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.name = name;
    user.birthday = birthday;
    user.gender = gender;
    user.city = city;
    user.district = district;
    user.ward = ward;
    user.type = type;
    user.hash_password = bcrypt.hashSync(password, 10);
    user.confirmToken = randomstring.generate(30) + new Date().getTime();
    Mailer.sendConfirmEmail(email, user.confirmToken);
    await user.save();
    
    let child = new ChildModel({
      companyId: parent._id,
      personalId: user._id,
      status: global.STATUS.CHILD_ACCEPTED
    });
    
    await child.save();
    
    // create notify
    const notifyParam = {
      fromUserId: parent._id,
      toUserId: user._id,
      title: NotifyContent.RequestChild.Title,
      content: NotifyContent.RequestChild.Content,
      type: NotifyTypes.PARENT_CHILD.REQUEST,
      params: {
        requestId: child._id
      }
    };
    
    await NotifyController.createNotify(notifyParam);
    
    // send Socket
    const socketContents = {...notifyParam, toUserIds: [user._id]};
    delete socketContents.toUserId;
    Socket.broadcast(SocketEvents.NOTIFY, socketContents);
    
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: child,
      message: 'Success'
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
    if (!token || token.length < 30) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'Invalid token'
      });
    }
    
    const user = await UserModel.findOne({confirmToken: token});
    
    if (!user) {
      return res.json({
        status: HTTP_CODE.ERROR,
        data: {},
        message: 'Token not found'
      });
    }
    
    user.status = global.STATUS.ACTIVE;
    
    await user.save();
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: {},
      message: 'Success'
    });
  } catch (e) {
    logger.error('UserController::confirm::error', e);
    return next(e);
  }
};

const register = async (req, res, next) => {
  logger.info('UserController::register is called');
  var {
    username, email, password, phone, name,
    birthday, gender, city, district, ward, type
  } = req.body;
  
  email = email.toLowerCase();
  
  try {
    if (!EmailValidator.validate(email)) {
      return next(new Error('Invalid email'));
    }
    
    if (!password || password.length < 6) {
      return next(new Error('Invalid password'));
    }
    
    if (!phone || phone.length < 10) {
      return next(new Error('Invalid phone'));
    }
    
    if (!name || name.length < 3) {
      return next(new Error('Invalid name'));
    }
    
    if (type !== global.USER_TYPE_PERSONAL && type !== global.USER_TYPE_COMPANY) {
      return next(new Error('Invalid type'));
    }
    
    if (!username || username.length < 6) {
      return next(new Error('Invalid username'));
    }
    
    let user = await UserModel.findOne({username: username});
    if (user) {
      return next(new Error('Duplicated username'));
    }
    
    user = await UserModel.findOne({email: email});
    
    if (user) {
      return next(new Error('Invalid email'));
    }
    
    user = new UserModel();
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.name = name;
    user.birthday = birthday;
    user.gender = gender;
    user.city = city;
    user.district = district;
    user.ward = ward;
    user.type = type;
    user.hash_password = bcrypt.hashSync(password, 10);
    user.confirmToken = randomstring.generate(30) + new Date().getTime();
    Mailer.sendConfirmEmail(email, user.confirmToken);
    await user.save();
    
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: {},
      message: 'Success'
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
    const user = req.user;
    const id = req.params.id;
    const status = req.body.status;
    const child = await ChildModel.findOne({
      _id: id
    });
    
    if (!child) {
      logger.error('UserController::childResponse::error. Request not exists.');
      return next(new Error('Request not exists.'));
    }
    
    if (status === global.STATUS.CHILD_ACCEPTED || status === global.STATUS.CHILD_REJECTED) {
      child.status = status;
    }
    
    await child.save();
    const {Title, Content} = status === global.STATUS.CHILD_ACCEPTED ?
      NotifyContent.ResponseChildStatusAccepted :
      NotifyContent.ResponseChildStatusRejected;
    
    const notifyParam = {
      fromUserId: user._id,
      toUserId: child.companyId,
      title: Title,
      content: Content,
      type: NotifyTypes.PARENT_CHILD.RESPONSE,
      params: {
        status // show status of child's response
      }
    };
    await NotifyController.createNotify(notifyParam);
    
    const socketContents = {...notifyParam, toUserIds: [child.companyId]};
    delete socketContents.toUserId;
    Socket.broadcast(SocketEvents.NOTIFY, socketContents);
    
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: child,
      message: 'request success !'
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
        return res.json({
          status: HTTP_CODE.SUCCESS,
          message: 'Success',
          data: user
        });
      })
      .catch((err) => {return next(err)});
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

const resendConfirm = async (req, res, next) => {
  logger.info('UserController::resendConfirm is called');
  try {
    const email = req.body.email;
    if (!email) {
      return res.json({
        status: HTTP_CODE.BAD_REQUEST,
        data: {},
        message: 'Email is required'
      });
    }
    
    const user = await UserModel.findOne({
      email: email,
      status: global.STATUS.PENDING_OR_WAIT_COMFIRM
    });
    
    if (!user) {
      return res.json({
        status: HTTP_CODE.ERROR,
        data: {},
        message: 'user not found or invalid status'
      });
    }
    Mailer.sendConfirmEmail(user.email, user.confirmToken);
    
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: {},
      message: 'request success'
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
    var {
      email,
      password,
      name,
      phone,
      birthday,
      gender,
      city,
      district,
      ward,
      type,
      avatar,
      oldPassword
    } = req.body;
    ImageService.putUpdateImage([user.avatar], [avatar]);
    
    email = email.toLowerCase();
    
    if (email) {
      if (!EmailValidator.validate(email)) {
        return next(new Error('Email không đúng'));
      }
      
      user.email = email;
    }
    
    if (password) {
      if (!password || password.length < 6) {
        return next(new Error('Mật khẩu mới không đúng cú pháp'));
      }
      
      if (!oldPassword || !await bcrypt.compareSync(oldPassword, user.hash_password)) {
        return next(new Error('Mật khẩu cũ không khớp'));
      }
      
      user.password = bcrypt.hashSync(password, 10);
    }
    
    if (phone) {
      if (phone.length < 6) {
        return next(new Error('Số điện thoại không đúng. Ít nhất 6 ký tự'));
      }
      
      user.phone = phone;
    }
    
    if (name) {
      if (name.length < 3) {
        return next(new Error('Tên không đúng. Ít nhất 3 ký tự'));
      }
      
      user.name = name;
    }
    
    user.birthday = birthday || user.birthday;
    user.avatar = avatar || user.avatar;
    user.gender = gender || user.gender;
    user.city = city || user.city;
    user.district = district || user.district;
    user.ward = ward || user.ward;
    
    if (type) {
      if (type !== global.USER_TYPE_PERSONAL && type !== global.USER_TYPE_COMPANY) {
        return next(new Error('Invalid type'));
      }
      
      user.type = type;
    }
    
    await user.save();
    
    logger.info('UserController::update::success');
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: user,
      message: 'Success'
    });
  } catch (e) {
    logger.error('UserController::update::error', e);
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
  childRequest: async (req, res, next) => {
    
    try {
      var token = req.headers.accesstoken;
      var id = req.params.id;
      
      if (!token) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token empty !'
        });
      }
      
      var accessToken = await TokenModel.findOne({token: token});
      
      if (!accessToken) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token invalid'
        });
      }
      
      
      var user = await UserModel.findOne({_id: accessToken.user});
      
      if (!user) {
        
        return res.json({
          status: 0,
          data: {},
          message: 'user is not exist'
        });
      }
      
      if (user.type != global.USER_TYPE_COMPANY) {
        return res.json({
          status: 0,
          data: {},
          message: 'user does not have permission !'
        });
      }
      
      
      var person = await UserModel.findOne({_id: id});
      if (!person) {
        
        return res.json({
          status: 0,
          data: {},
          message: 'person is not exist'
        });
      }
      
      if (person.type != global.USER_TYPE_PERSONAL) {
        return res.json({
          status: 0,
          data: {},
          message: 'person invalid !'
        });
      }
      
      var child = await ChildModel.findOne({
        companyId: user._id,
        personalId: person._id,
        // status: {$in: [global.STATUS.CHILD_WAITING, global.STATUS.CHILD_ACCEPTED]}
      });
      if (child && (child.status == global.STATUS.CHILD_WAITING || child.status == global.STATUS.CHILD_ACCEPTED)) {
        return res.json({
          status: 0,
          data: {},
          message: 'request already sent'
        });
      }
      
      if (!child) {
        child = new ChildModel({
          companyId: user._id,
          personalId: person._id
        });
      }
      
      child.status = global.STATUS.CHILD_WAITING;
      
      await child.save();
      
      const notifyParam = {
        fromUserId: user._id,
        toUserId: person._id,
        title: NotifyContent.RequestChild.Title,
        content: NotifyContent.RequestChild.Content,
        type: NotifyTypes.PARENT_CHILD.REQUEST,
        params: {
          requestId: child._id
        }
      };
      await NotifyController.createNotify(notifyParam);
      
      const socketContents = {...notifyParam, toUserIds: [person._id]};
      delete socketContents.toUserId;
      Socket.broadcast(SocketEvents.NOTIFY, socketContents);
      
      return res.json({
        status: 1,
        data: child,
        message: 'request success !'
      });
      
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
  },
  
  requestList: async (req, res, next) => {
    try {
      
      var token = req.headers.accesstoken;
      
      if (!token) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token empty !'
        });
      }
      
      var accessToken = await TokenModel.findOne({token: token});
      
      if (!accessToken) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token invalid'
        });
      }
      
      
      var user = await UserModel.findOne({_id: accessToken.user});
      
      if (!user) {
        
        return res.json({
          status: 0,
          data: {},
          message: 'user is not exist'
        });
      }
      
      if (user.type != global.USER_TYPE_PERSONAL) {
        return res.json({
          status: 0,
          data: {},
          message: 'user does not have permission !'
        });
      }
      
      var parrents = await ChildModel.find({personalId: user._id, status: global.STATUS.CHILD_WAITING});
      
      let results = await Promise.all(parrents.map(async parrent => {
        
        let company = await UserModel.findOne({_id: parrent.companyId});
        
        
        return {
          id: parrent._id,
          parent: {
            id: company ? company._id : 'unknown',
            username: company ? company.username : 'unknown',
            email: company ? company.email : 'unknown',
            name: company ? company.name : 'unknown'
          },
          status: company.status
        };
        
        
      }));
      
      return res.json({
        status: 1,
        data: results,
        message: 'request success !'
      });
      
    } catch
      (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
  },
  
  childList: async (req, res, next) => {
    try {
      var token = req.headers.accesstoken;
      
      if (!token) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token empty !'
        });
      }
      
      var accessToken = await TokenModel.findOne({token: token});
      
      if (!accessToken) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token invalid'
        });
      }
      
      
      var user = await UserModel.findOne({_id: accessToken.user});
      
      if (!user) {
        
        return res.json({
          status: 0,
          data: {},
          message: 'user is not exist'
        });
      }
      
      if (user.type != global.USER_TYPE_COMPANY) {
        return res.json({
          status: 0,
          data: {},
          message: 'user does not have permission !'
        });
      }
      
      var children = await ChildModel.find({
        companyId: user._id,
        status: {$in: [global.STATUS.CHILD_WAITING, global.STATUS.CHILD_ACCEPTED, global.STATUS.CHILD_REJECTED]}
      });
      
      let results = await Promise.all(children.map(async child => {
        
        let personal = await UserModel.findOne({_id: child.personalId});
        
        var account = await AccountModel.findOne({owner: child.personalId});
        
        
        if (!account) {
          account = new AccountModel({owner: child.personalId});
          account = await account.save();
        }
        
        var accountInfo = {
          main: account.main,
          promo: account.promo,
          credit: child.credit,
          creditUsed: child.creditUsed
          
        };
        
        
        return {
          id: personal ? personal._id : 'unknown',
          username: personal ? personal.username : 'unknown',
          email: personal ? personal.email : 'unknown',
          name: personal ? personal.name : 'unknown',
          status: child.status,
          balance: accountInfo
        };
        
        
      }));
      
      return res.json({
        status: 1,
        data: results,
        message: 'request success !'
      });
      
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
    
  },
  
  findUserByEmail: async (req, res, next) => {
    
    try {
      
      var token = req.headers.accesstoken;
      var email = req.params.email;
      
      if (!token) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token empty !'
        });
      }
      
      var accessToken = await TokenModel.findOne({token: token});
      
      if (!accessToken) {
        return res.json({
          status: 0,
          data: {},
          message: 'access token invalid'
        });
      }
      
      
      var user = await UserModel.findOne({_id: accessToken.user});
      
      if (!user) {
        
        return res.json({
          status: 0,
          data: {},
          message: 'user is not exist'
        });
      }
      
      if (user.type != global.USER_TYPE_COMPANY) {
        return res.json({
          status: 0,
          data: {},
          message: 'user does not have permission !'
        });
      }
      
      var personal = await UserModel.findOne({email: email});
      if (!personal || personal.type != global.USER_TYPE_PERSONAL) {
        return res.json({
          status: 0,
          data: {},
          message: 'email not found !'
        });
      }
      
      var child = await ChildModel.findOne({companyId: user._id, personalId: personal._id});
      
      var transfer = undefined;
      
      
      return res.json({
        status: 1,
        data: {
          id: personal._id,
          username: personal.username,
          email: personal.email,
          name: personal.name,
          status: !child ? global.STATUS.CHILD_NONE : child.status,
          transfer: transfer && transfer.sum ? transfer.sum : 0
        },
        message: 'request success'
      });
      
      
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
    
  },
  
  highlight: async (req, res, next) => {
    
    try {
      
      
      let users = await
        UserModel.find({phone: {$ne: null}, avatar: {$ne: null}}).sort({date: -1}).limit(10);
      
      let results = await
        Promise.all(users.map(async user => {
          
          
          let result = {
            id: user._id,
            
            username: user.username,
            email: user.email,
            phone: user.phone,
            name: user.name,
            birthday: user.birthday,
            gender: user.gender,
            city: user.city,
            avatar: user.avatar,
            district: user.district,
            ward: user.ward,
            type: user.type
            
          };
          
          
          return result;
          
        }));
      
      
      return res.json({
        status: 1,
        data: results,
        message: 'request success '
      });
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
    
  },
  
  check: async (req, res, next) => {
    var username = req.body.username;
    var email = req.body.email;
    
    email = email.toLowerCase();
    
    if (!username && !email) {
      return res.json({
        status: 0,
        data: {},
        message: 'put email or username in body of request :)'
      });
    }
    
    if (username && username.length < 6) {
      return res.json({
        status: 1,
        data: false,
        message: 'user invalid'
      });
      
    }
    
    if (email && !EmailValidator.validate(email)) {
      
      return res.json({
        status: 1,
        data: false,
        message: 'email invalid'
      });
      
    }
    
    try {
      
      let user = await UserModel.findOne(username ? {username: username} : {email: email});
      
      
      if (user) {
        return res.json({
          status: 1,
          data: false,
          message: (username ? 'username' : 'email') + ' duplicated'
        });
      } else {
        return res.json({
          status: 1,
          data: true,
          message: (username ? 'username' : 'email') + ' available'
        });
      }
      
      
    } catch (e) {
      return res.json({
        status: 0,
        data: {},
        message: 'unknown error : ' + e.message
      });
    }
    
  },
  
  resendConfirm,
  update
};

module.exports = UserController;
