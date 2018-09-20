const mongoose = require('mongoose');
const NotifyModel = require('../models/Notify');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const httpCode = require('../config/http-code');

/**
 * 
 * @param {*} status 
 * @return {Boolean}
 */
const isValidStatusForUpdating = (status) => {
  return [
    global.STATUS.NOTIFY_NONE, 
    global.STATUS.NOTIFY_READ
  ].indexOf(status) !== -1;
}


/**
 * Create a notify from fromUser to toUser
 * @param {*} params {fromUserId, toUserId, title, content}
 * @return {Notify}
 */
const createNotify = async (params) => {
  logger.info('NotifyController::createNotify is called', params);

  var newNotify = await new NotifyModel({
    fromUser: new mongoose.Types.ObjectId(params.fromUserId),
    toUser: new mongoose.Types.ObjectId(params.toUserId),
    status: global.STATUS.NOTIFY_NONE,
    title: params.title.toString().trim(),
    content: params.content.toString().trim(),
    createdTime: new Date(),
    updatedTime: new Date()
  });

  return newNotify;
}

/**
 * 
 * @param {*} req body: {status, title, content}, params: {notifyId}
 * @param {*} res 
 * @param {*} next 
 */
const updateNotify = async (req, res, next) => {
  logger.info('NotifyController::updateNotify is called');

  try {
    const notify = await NotifyModel.findOne({ _id: req.params.notifyId });

    let { title, content, status } = req.body;
    if (isNaN(status)) {
      return res.json({
        status: httpCode.BAD_REQUEST,
        message: ['Status is not a number'],
        data: {}
      });
    } else {
      status = parseInt(status);
    }

    if (notify == null) {
      return res.json({
        status: httpCode.ERROR,
        message: ['Notify not found'],
        data: {}
      });
    }

    if (title) {
      notify.title = title.toString().trim();
    }

    if (content) {
      notify.content = content.toString().trim();
    }

    if (status && isValidStatusForUpdating(status)) {
      notify.status = status;
    }

    notify.updatedTime = new Date();
    await notify.save();

    return res.json({
      status: httpCode.SUCCESS,
      message: ['Update notify successfully'],
      data: {}
    });

  } catch (e) {
    logger.error('NotifyController::updateNotify:error', e);
    return next(e);
  }
}

module.exports = {
  createNotify,
  updateNotify
};