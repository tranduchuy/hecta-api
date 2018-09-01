var PaymentModel = require('../models/TransactionHistoryModel');
var AccountModel = require('../models/AccountModel');
var TransactionHistoryModel = require('../models/TransactionHistoryModel');
var TokenModel = require('../models/TokenModel');
var ChildModel = require('../models/ChildModel');
var UserModel = require('../models/UserModel');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var RequestUtil = require('../utils/RequestUtil');

var extractSearchCondition = function(req) {
    var cond = { 
        userId: req.user._id 
    };

    if (req.query.startDay && !isNaN(req.query.startDay)) {
        cond.date = cond.date || {};
        cond.date['$gte'] = parseInt(req.query.startDate, 0);
    }

    if (req.query.endDay && !isNaN(req.query.endDay)) {
        cond.date = cond.date || {};
        cond.date['$lte'] = parseInt(req.query.endDay, 0);
    }

    if (req.query.type && !isNaN(req.query.type)) {
        cond.type = parseInt(req.query.type, 0);
    }

    return cond;
}

var TransactionController = {

    addMain: async function (req, res, next) {

        var token = req.headers.access_token;
        var userId = req.params.id;
        var amount = req.body.amount;
        var note = req.body.note;
        var info = req.body.info;


        try {


            if (!token) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token empty !'
                });
            }

            var accessToken = await TokenModel.findOne({ token: token });

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var admin = await UserModel.findOne({
                _id: accessToken.user,
                status: global.STATUS.ACTIVE,
                role: { $in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN] }
            });

            if (!admin) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin is not exist'
                });
            }

            var user = await UserModel.findOne({ _id: userId });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (!_.isNumber(amount) && amount > 0) {
                return res.json({
                    status: 0,
                    data: { amount: amount },
                    message: 'mount is invalid'
                });
            }

            var account = await AccountModel.findOne({ owner: user._id })

            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    main: 0
                });
            }


            let child = await ChildModel({ status: global.STATUS.ACTIVE, personalId: user._id });
            var transaction = new TransactionHistoryModel({

                userId: new ObjectId(userId),
                adminId: new ObjectId(admin._id),
                amount: amount,
                note: note,
                info: info,
                type: global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT,

                current: {
                    credit: child ? (child.credit - child.creditUsed) : 0,
                    main: account.main,
                    promo: account.promo
                }
            });


            account.main += amount;

            await account.save();
            await transaction.save();


            return res.json({
                status: 1,
                data: {},
                message: 'request success!'
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
    addPromo: async function (req, res, next) {

        var token = req.headers.access_token;
        var userId = req.params.id;
        var amount = req.body.amount;
        var note = req.body.note;
        var info = req.body.info;


        try {


            if (!token) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token empty !'
                });
            }

            var accessToken = await TokenModel.findOne({ token: token });

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var admin = await UserModel.findOne({ _id: accessToken.user });

            if (!admin) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin is not exist'
                });
            }

            var user = await UserModel.findOne({ _id: userId });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (!_.isNumber(amount) && amount > 0) {
                return res.json({
                    status: 0,
                    data: { amount: amount },
                    message: 'mount is invalid'
                });
            }

            var account = await AccountModel.findOne({ owner: user._id });

            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    promo: 0
                });
            }

            let child = await ChildModel({ status: global.STATUS.ACTIVE, personalId: user._id });
            var transaction = new TransactionHistoryModel({

                userId: new ObjectId(userId),
                adminId: new ObjectId(admin._id),
                amount: amount,
                note: note,
                info: info,
                type: global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT,

                current: {
                    credit: child ? (child.credit - child.creditUsed) : 0,
                    main: account.main,
                    promo: account.promo
                }
            });

            account.promo += amount;

            transaction.save();
            await account.save();
            return res.json({
                status: 1,
                data: {},
                message: 'request success!'
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

    list: async function (req, res, next) {
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

            let transactions = await TransactionHistoryModel
                .find(searchCondition)
                .sort({ date: -1 })
                .skip((paginationCond.page - 1) * paginationCond.limit)
                .limit(paginationCond.limit)
                .populate('userId');

            let count = await TransactionHistoryModel.count(searchCondition);

            return res.json({
                status: 1,
                data: {
                    items: transactions,
                    page: paginationCond.page,
                    limit: paginationCond.limit,
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
    childList: async function (req, res, next) {


        try {
            var token = req.headers.access_token;
            var page = req.query.page;
            var id = req.query.id;

            if (!token) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token empty !'
                });
            }

            var accessToken = await TokenModel.findOne({ token: token });

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({
                _id: accessToken.user,
                status: global.STATUS.ACTIVE,
                role: global.USER_ROLE_ENDUSER
            });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            let child = await ChildModel.findOne({
                status: global.STATUS.CHILD_ACCEPTED,
                companyId: user._id,
                personalId: id
            });

            if (!child) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'child not exist'
                });
            }

            if (!page || page < 1) {
                page = 1;
            }

            let transactions = await TransactionHistoryModel.find({ userId: id }).sort({ date: -1 }).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
            let count = await TransactionHistoryModel.count({ userId: id });
            return res.json({
                status: 1,
                data: {
                    items: transactions,
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

    }

}
module.exports = TransactionController
