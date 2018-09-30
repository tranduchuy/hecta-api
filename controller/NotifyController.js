const mongoose = require('mongoose');
const NotifyModel = require('../models/Notify');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const httpCode = require('../config/http-code');
const requestUtil = require('../utils/RequestUtil');

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
};


/**
 * @description Create a notify from fromUser to toUser
 * @param {*} _params {fromUserId, toUserId, title, content}
 * @return {Object}
 */
const createNotify = async (_params) => {
    const params = {..._params};
    logger.info('NotifyController::createNotify is called', params);
    const newNotify = await new NotifyModel();
    newNotify.fromUser = params.fromUserId ? new mongoose.Types.ObjectId(params.fromUserId) : null;
    newNotify.toUser = new mongoose.Types.ObjectId(params.toUserId);
    newNotify.status = global.STATUS.NOTIFY_NONE;
    newNotify.title = params.title.toString().trim();
    newNotify.content = params.content.toString().trim();
    newNotify.createdTime = new Date();
    newNotify.updatedTime = new Date();
    newNotify.type = params.type;
    newNotify.params = params.params;
    await newNotify.save();

    return newNotify;
};

/**
 *
 * @param {*} req body: {status, title, content}, params: {notifyId}
 * @param {*} res
 * @param {*} next
 */
const updateNotify = async (req, res, next) => {
    logger.info('NotifyController::updateNotify is called');

    try {
        const notify = await NotifyModel.findOne({_id: req.params['notifyId']});

        let {title, content, status} = req.body;
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
};

/**
 * Api get list notify
 * @param {*} req body: {status, title, content}, params: {notifyId}
 * @param {*} res
 * @param {*} next
 */
const getListNotifies = async (req, res, next) => {
    logger.info('NotifyController::getListNotifies is called');
    try {
        const {page, limit} = requestUtil.extractPaginationCondition(req);
        const query = {
            toUser: req.user._id
        };

        const total = await NotifyModel.estimatedDocumentCount(query);

        let notifies = await NotifyModel
            .find(query)
            .sort({createdTime: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('fromUser');

        return res.json({
            status: httpCode.SUCCESS,
            message: [],
            data: {
                meta: {
                    total,
                    page,
                    limit,
                    sortBy: 'createdTime'
                },
                entry: notifies
            }
        })

    } catch (e) {
        logger.error('NotifyController::getListNotifies::error', e);
        return next(e);
    }
};

const getUnReadCountOfUser = (userId, cb) => {
    const query = {
        toUser: userId,
        status: global.STATUS.NOTIFY_NONE
    };

    NotifyModel.countDocuments(query, cb);
};

const countUnRead = async (req, res, next) => {
    logger.info('NotifyController::countUnRead is called');

    try {
        getUnReadCountOfUser(req.user._id, (err, count) => {
            if (err) {
                logger.error('NotifyController::countUnRead::error', e);
                return next(err);
            }

            return res.json({
                status: httpCode.SUCCESS,
                message: '',
                data: {
                    entry: [],
                    meta: {
                        unread: count
                    }
                }
            })
        });
    } catch (e) {
        logger.error('NotifyController::countUnRead::error', e);
        return next(e);
    }
};

module.exports = {
    createNotify,
    updateNotify,
    getListNotifies,
    countUnRead
};