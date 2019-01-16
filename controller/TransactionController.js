const NotifyController = require('../controller/NotifyController');
var PaymentModel = require('../models/TransactionHistoryModel');
var AccountModel = require('../models/AccountModel');
var TransactionHistoryModel = require('../models/TransactionHistoryModel');
var TokenModel = require('../models/TokenModel');
var ChildModel = require('../models/ChildModel');
var UserModel = require('../models/UserModel');
var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var RequestUtil = require('../utils/RequestUtil');
var HTTP_CODE = require('../config/http-code');
const Socket = require('../utils/Socket');
const NotifyContent = require('../config/notify-content');
const SocketEvents = require('../config/socket-event');
const NotifyTypes = require('../config/notify-type');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const {get, post} = require('../utils/Request');
const CDP_APIS = require('../config/cdp-url-api.constant');

const extractSearchCondition = function (req, childId) {
  const cond = {
    userId: childId || req.user._id
  };
  
  const {startDay, endDay, type} = req.query;
  
  if (startDay && !isNaN(startDay)) {
    cond.date = cond.date || {};
    cond.date['$gte'] = parseInt(startDay, 0);
  }
  
  if (endDay && !isNaN(endDay)) {
    cond.date = cond.date || {};
    cond.date['$lte'] = parseInt(endDay, 0);
  }
  
  if (type && !isNaN(type)) {
    cond.type = parseInt(type, 0);
  }
  
  return cond;
};

const TransactionController = {
  addMain: async function (req, res, next) {
    logger.info('TransactionController::addMain is called');
    const userId = req.params.id;
    const {amount, note, info} = req.body;
    
    try {
      const admin = req.user;
      if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
        return res.json({
          status: HTTP_CODE.ERROR,
          message: 'Permission denied',
          data: {}
        });
      }
      
      const user = await UserModel.findOne({_id: userId});
      if (!user) {
        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          data: {},
          message: 'User is not exist'
        });
      }
      
      if (!_.isNumber(amount) || amount < 0) {
        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          data: {amount},
          message: 'Amount is invalid'
        });
      }
      
      let account = await AccountModel.findOne({owner: user._id});
      if (!account) {
        account = new AccountModel({
          owner: user._id,
          main: 0
        });
      }
      
      let child = await ChildModel({
        status: global.STATUS.ACTIVE,
        personalId: user._id
      });
      
      let before = {
        credit: child ? (child.credit - child.creditUsed) : 0,
        main: account.main,
        promo: account.promo
      };
      account.main += amount;
      
      let after = {
        credit: child ? (child.credit - child.creditUsed) : 0,
        main: account.main,
        promo: account.promo
      };
      
      await account.save();
      await TransactionHistoryModel.addTransaction(user._id, admin._id, amount, note, info, global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT, before, after);
      
      // notify
      const notifyParams = {
        fromUserId: admin._id,
        toUserId: user._id,
        title: NotifyContent.AddMain.Title,
        content: NotifyContent.AddMain.Content,
        type: NotifyTypes.CHANGE_TRANSACTION,
        params: {
          before,
          after
        }
      };
      NotifyController.createNotify(notifyParams);
      
      // send socket
      notifyParams.toUserIds = [notifyParams.toUserId];
      delete notifyParams.toUserId;
      Socket.broadcast(SocketEvents.NOTIFY, notifyParams);
      
      return res.json({
        status: HTTP_CODE.SUCCESS,
        data: {},
        message: 'Request success!'
      });
    } catch (e) {
      logger.error('TransactionController::addMain::error', e);
      return next(e);
    }
  },
  
  addPromo: async function (req, res, next) {
    logger.info('TransactionController::addPromo is called');
    const userId = req.params.id;
    const {amount, note, info} = req.body;
    
    try {
      const admin = req.user;
      const user = await UserModel.findOne({_id: userId});
      
      if (!user) {
        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          data: {},
          message: 'User is not exist'
        });
      }
      
      if (!_.isNumber(amount) || amount < 0) {
        return res.json({
          status: HTTP_CODE.BAD_REQUEST,
          data: {amount: amount},
          message: 'Amount is invalid'
        });
      }
      
      let account = await AccountModel.findOne({owner: user._id});
      if (!account) {
        account = new AccountModel({
          owner: user._id,
          promo: 0
        });
      }
      
      let child = await ChildModel({status: global.STATUS.ACTIVE, personalId: user._id});
      let before = {
        credit: child ? (child.credit - child.creditUsed) : 0,
        main: account.main,
        promo: account.promo
      };
      
      account.promo += amount;
      
      let after = {
        credit: child ? (child.credit - child.creditUsed) : 0,
        main: account.main,
        promo: account.promo
      };
      
      await account.save();
      await TransactionHistoryModel.addTransaction(user._id, admin._id, amount, note, info, global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT, before, after);
      
      // notify
      const notifyParams = {
        fromUserId: admin._id,
        toUserId: user._id,
        title: NotifyContent.AddPromo.Title,
        content: NotifyContent.AddPromo.Content,
        type: NotifyTypes.CHANGE_TRANSACTION,
        params: {
          before,
          after
        }
      };
      NotifyController.createNotify(notifyParams);
      
      // send socket
      notifyParams.toUserIds = [notifyParams.toUserId];
      delete notifyParams.toUserId;
      Socket.broadcast(SocketEvents.NOTIFY, notifyParams);
      
      return res.json({
        status: HTTP_CODE.SUCCESS,
        data: {},
        message: 'Request success!'
      });
    } catch (e) {
      logger.error('TransactionController::addMain::error', e);
      return next(e);
    }
  },
  
  list: async function (req, res, next) {
    logger.info('TransactionController::list is called');
    try {
      get(CDP_APIS.TRANSACTION_HISTORY.LIST_MY, req.user.token)
        .then(async (r) => {
          let transactions = await Promise.all(r.data.entries.map(async transaction => {
            
            if (ObjectId.isValid(transaction.note)) {
              if (transaction.type === global.TRANSACTION_TYPE_PAY_POST ||
                transaction.type === global.TRANSACTION_TYPE_UP_NEW) {
                const post = await PostModel.findOne({_id: transaction.note});
                if (post){
                  const sale = await SaleModel.findOne({_id: post.contentId});
                  if (sale) {
                    transaction.info = {
                      id: post._id,
                      title: sale.title
                    };
                  }
                }
              }
            }
            return transaction;
          }));
          
          return res.json({
            status: HTTP_CODE.SUCCESS,
            message: 'Success',
            data: {
              items: transactions,
              total: _.ceil(r.data.meta.totalRecords / 20),
              itemCount: r.data.meta.totalRecords
            }
          });
        })
        .catch((err) => {
          return next(err)
        });
    }
    catch (e) {
      return res.json({
        status: HTTP_CODE.ERROR,
        data: {},
        message: 'Unknown error : ' + e.message
      });
    }
  },
  
  childList: async function (req, res) {
  
    logger.info('TransactionController::childList is called');
    try {
  
      const childId =  '?childId=' + req.params.id;
      
      get(CDP_APIS.TRANSACTION_HISTORY.LIST_CHILD + childId, req.user.token)
        .then(async (r) => {
          let transactions = await Promise.all(r.data.entries.map(async transaction => {
          
            if (ObjectId.isValid(transaction.note)) {
              if (transaction.type === global.TRANSACTION_TYPE_PAY_POST ||
                transaction.type === global.TRANSACTION_TYPE_UP_NEW) {
                const post = await PostModel.findOne({_id: transaction.note});
                if (post){
                  const sale = await SaleModel.findOne({_id: post.contentId});
                  if (sale) {
                    transaction.info = {
                      id: post._id,
                      title: sale.title
                    };
                  }
                }
              }
            }
            return transaction;
          }));
        
          return res.json({
            status: HTTP_CODE.SUCCESS,
            message: 'Success',
            data: {
              items: transactions,
              total: _.ceil(r.data.meta.totalRecords / 20),
              itemCount: r.data.meta.totalRecords
            }
          });
        })
        .catch((err) => {
          return next(err)
        });
    }
    catch (e) {
      return res.json({
        status: HTTP_CODE.ERROR,
        data: {},
        message: 'Unknown error : ' + e.message
      });
    }
  }
};

module.exports = TransactionController;
