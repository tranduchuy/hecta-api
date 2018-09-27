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

    list: async function (req, res) {
        try {
            if (req.user.role != global.USER_ROLE_ENDUSER) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            var paginationCond = RequestUtil.extractPaginationCondition(req);
            var searchCondition = extractSearchCondition(req);

            console.log("searchCondition ", searchCondition);
            console.log("paginationCond ", paginationCond);

            let transactions = await TransactionHistoryModel
                .find(searchCondition)
                .sort({date: -1})
                .skip((paginationCond.page - 1) * paginationCond.limit)
                .limit(paginationCond.limit)
                .populate('userId');

            let count = await TransactionHistoryModel.count(searchCondition);

            let results = await Promise.all(transactions.map(async transaction => {


                    if (!transaction.before) {
                        transaction.before = {
                            credit: 0,
                            main: 0,
                            promo: 0
                        };
                    }
                    if (!transaction.after) {
                        transaction.after = {
                            credit: 0,
                            main: 0,
                            promo: 0
                        };
                    }
                    let result = {

                        date: transaction.date,
                        main: transaction.after.main - transaction.before.main,
                        credit: transaction.after.credit - transaction.before.credit,
                        promo: transaction.after.promo - transaction.before.promo,
                        after: transaction.after,
                        before: transaction.before,
                        note: transaction.note,
                        type: transaction.type,
                        amount: transaction.amount
                    };


                    if (ObjectId.isValid(transaction.info)) {
                        if (transaction.type == global.TRANSACTION_TYPE_SHARE_CREDIT || transaction.type == global.TRANSACTION_TYPE_RECEIVE_CREDIT || transaction.type == global.TRANSACTION_TYPE_GIVE_MONEY_BACK || transaction.type == global.TRANSACTION_TYPE_TAKE_BACK_MONEY) {
                            var user = await UserModel.findOne({_id: transaction.info});

                            if (user) {
                                result.info = {
                                    username: user.username,
                                    email: user.email,
                                    phone: user.phone,
                                    name: user.name
                                };
                            }

                        }

                        if (transaction.type == global.TRANSACTION_TYPE_PAY_POST || transaction.type == global.TRANSACTION_TYPE_UP_NEW) {
                            let post = await PostModel.findOne({_id: transaction.info});
                            if (post) {
                                let sale = await SaleModel.findOne({_id: post.content_id});
                                if (sale) {
                                    result.info = {
                                        id: post._id,
                                        title: sale.title
                                    };
                                }
                            }
                        }
                    }
                    return result;
                }
            ));


            return res.json({
                status: HTTP_CODE.SUCCESS,
                data: {
                    itemCount: count,
                    items: results,
                    page: paginationCond.page,
                    limit: paginationCond.limit,
                    total: _.ceil(count / paginationCond.limit)
                },
                message: 'Success'
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
        try {
            if (req.user.status != global.STATUS.ACTIVE) {
                return res.json({
                    status: HTTP_CODE.ERROR,
                    data: {},
                    message: 'Permission denied'
                });
            }


            var childId = req.params.id;


            var child = await ChildModel.findOne({
                status: global.STATUS.CHILD_ACCEPTED,
                companyId: req.user._id,
                personalId: childId
            });


            if (!child) {
                return res.json({
                    status: HTTP_CODE.ERROR,
                    data: {},
                    message: 'Child is not exist'
                });
            }

            var paginationCond = RequestUtil.extractPaginationCondition(req);
            var searchCondition = extractSearchCondition(req, childId);

            var transactions = await TransactionHistoryModel
                .find(searchCondition)
                .sort({date: -1})
                .skip((paginationCond.page - 1) * paginationCond.limit)
                .limit(paginationCond.limit)
                .populate('userId');

            let count = await TransactionHistoryModel.count(searchCondition);


            let results = await Promise.all(transactions.map(async transaction => {


                    if (!transaction.before) {
                        transaction.before = {
                            credit: 0,
                            main: 0,
                            promo: 0
                        };
                    }
                    if (!transaction.after) {
                        transaction.after = {
                            credit: 0,
                            main: 0,
                            promo: 0
                        };
                    }
                    let result = {

                        date: transaction.date,
                        main: transaction.after.main - transaction.before.main,
                        credit: transaction.after.credit - transaction.before.credit,
                        promo: transaction.after.promo - transaction.before.promo,
                        after: transaction.after,
                        before: transaction.before,
                        note: transaction.note,
                        type: transaction.type,
                        amount: transaction.amount
                    };


                    if (ObjectId.isValid(transaction.info)) {
                        if (transaction.type == global.TRANSACTION_TYPE_SHARE_CREDIT || transaction.type == global.TRANSACTION_TYPE_RECEIVE_CREDIT) {
                            var user = await UserModel.findOne({_id: transaction.info});

                            if (user) {
                                result.info = {
                                    username: user.username,
                                    email: user.email,
                                    phone: user.phone,
                                    name: user.name
                                };
                            }

                        }

                        if (transaction.type == global.TRANSACTION_TYPE_PAY_POST || transaction.type == global.TRANSACTION_TYPE_UP_NEW) {
                            let post = await PostModel.findOne({_id: transaction.info});
                            if (post) {
                                let sale = await SaleModel.findOne({_id: post.content_id});
                                if (sale) {
                                    result.info = {
                                        id: post._id,
                                        title: sale.title
                                    };
                                }
                            }
                        }
                    }
                    return result;
                }
            ));

            return res.json({
                status: 1,
                data: {
                    items: results,
                    page: paginationCond.page,
                    limit: paginationCond.limit,
                    total: _.ceil(count / paginationCond.limit)
                },
                message: 'Success'
            });
        }
        catch (e) {
            return res.json({
                status: HTTP_CODE.ERROR,
                data: {},
                message: 'Unknow error : ' + e.message
            });
        }
    }
};

module.exports = TransactionController;
