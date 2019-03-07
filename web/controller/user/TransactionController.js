const NotifyController = require('./NotifyController');
const AccountModel = require('../../models/AccountModel');
const TransactionHistoryModel = require('../../models/TransactionHistoryModel');
const ChildModel = require('../../models/ChildModel');
const UserModel = require('../../models/UserModel');
const SaleModel = require('../../models/SaleModel');
const PostModel = require('../../models/PostModel');
const _ = require('lodash');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const HTTP_CODE = require('../../config/http-code');
const Socket = require('../../utils/Socket');
const NotifyContent = require('../../config/notify-content');
const SocketEvents = require('../../config/socket-event');
const NotifyTypes = require('../../config/notify-type');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const {get, post, del, put} = require('../../utils/Request');
const CDP_APIS = require('../../config/cdp-url-api.constant');

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

const addMain = async (req, res, next) => {
  logger.info('TransactionController::addMain is called');
  const userId = req.params.id;
  const {amount, note, info} = req.body;

  try {
    const postData = {
      userId: parseInt(userId),
      main1: amount
    };

    post(CDP_APIS.ADMIN.UPDATE_BALANCE, postData, req.user.token)
      .then(r => {
        const notifyParams = {
          fromUserId: req.user.id,
          toUserId: parseInt(userId),
          title: NotifyContent.AddMain.Title,
          content: NotifyContent.AddMain.Content,
          type: NotifyTypes.CHANGE_TRANSACTION,
          params: {
            before: r.data.meta.before,
            after: r.data.meta.after
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
      })
      .catch(e => {
        logger.error('TransactionController::addMain::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('TransactionController::addMain::error', e);
    return next(e);
  }
};

const addPromo = async (req, res, next) => {
  logger.info('TransactionController::addPromo::called');
  const userId = req.params.id;
  const {amount, note, info} = req.body;

  try {
    const postData = {
      userId: parseInt(userId),
      promo: amount
    };

    post(CDP_APIS.ADMIN.UPDATE_BALANCE, postData, req.user.token)
      .then(r => {
        const notifyParams = {
          fromUserId: req.user.id,
          toUserId: parseInt(userId),
          title: NotifyContent.AddMain.Title,
          content: NotifyContent.AddMain.Content,
          type: NotifyTypes.CHANGE_TRANSACTION,
          params: {
            before: r.data.meta.before,
            after: r.data.meta.after
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
      })
      .catch(e => {
        logger.error('TransactionController::addPromo::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('TransactionController::addPromo::error', e);
    return next(e);
  }
};

const childList = async (req, res) => {

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
};

const list = async (req, res, next) => {
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
};

module.exports = {
  addMain,
  addPromo,
  childList,
  list
};
