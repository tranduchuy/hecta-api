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
  // TODO: will update this list when new status of notify appeared
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

  var newNotify = await new NotifyModel();
  newNotify.fromUser = new mongoose.Types.ObjectId(params.fromUserId);
  newNotify.toUser = new mongoose.Types.ObjectId(params.toUserId);
  newNotify.status = global.STATUS.NOTIFY_NONE;
  newNotify.title = params.title.toString().trim();
  newNotify.content = params.content.toString().trim();
  newNotify.createdTime = new Date();
  newNotify.updatedTime = new Date();
  await newNotify.save();

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