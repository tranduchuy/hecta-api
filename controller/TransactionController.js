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
var HTTP_CODE = require('../config/http-code');

var extractSearchCondition = function (req, childId) {
    var cond = {
        userId: childId || req.user._id
    };

    if (req.query.startDay && !isNaN(req.query.startDay)) {
        cond.date = cond.date || {};
        cond.date['$gte'] = parseInt(req.query.startDay, 0);
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

    addMain: async function (req, res) {

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

            var accessToken = await TokenModel.findOne({token: token});

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
                role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
            });

            if (!admin) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin is not exist'
                });
            }

            var user = await UserModel.findOne({_id: userId});

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
                    data: {amount: amount},
                    message: 'mount is invalid'
                });
            }

            var account = await AccountModel.findOne({owner: user._id});

            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    main: 0
                });
            }


            let child = await ChildModel({status: global.STATUS.ACTIVE, personalId: user._id});
            // var transaction = new TransactionHistoryModel({
            //
            //     userId: new ObjectId(userId),
            //     adminId: new ObjectId(admin._id),
            //     amount: amount,
            //     note: note,
            //     info: info,
            //     type: global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT,
            //
            //     current: {
            //         credit: child ? (child.credit - child.creditUsed) : 0,
            //         main: account.main,
            //         promo: account.promo
            //     }
            // });

            let before = {
                credit: child ? (child.credit - child.creditUsed) : 0,
                main: account.main,
                promo: account.promo
            }
            account.main += amount;

            let after = {
                credit: child ? (child.credit - child.creditUsed) : 0,
                main: account.main,
                promo: account.promo
            }


            await account.save();
            await TransactionHistoryModel.addTransaction(user._id, admin._id, amount, note, info, global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT, before, after);


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

    addPromo: async function (req, res) {

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

            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var admin = await UserModel.findOne({_id: accessToken.user});

            if (!admin) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin is not exist'
                });
            }

            var user = await UserModel.findOne({_id: userId});

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
                    data: {amount: amount},
                    message: 'mount is invalid'
                });
            }

            var account = await AccountModel.findOne({owner: user._id});

            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    promo: 0
                });
            }

            let child = await ChildModel({status: global.STATUS.ACTIVE, personalId: user._id});
            // var transaction = new TransactionHistoryModel({
            //
            //     userId: new ObjectId(userId),
            //     adminId: new ObjectId(admin._id),
            //     amount: amount,
            //     note: note,
            //     info: info,
            //     type: global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT,
            //
            //     current: {
            //         credit: child ? (child.credit - child.creditUsed) : 0,
            //         main: account.main,
            //         promo: account.promo
            //     }
            // });

            let before = {
                credit: child ? (child.credit - child.creditUsed) : 0,
                main: account.main,
                promo: account.promo
            }
            account.promo += amount;

            let after = {
                credit: child ? (child.credit - child.creditUsed) : 0,
                main: account.main,
                promo: account.promo
            }


            await account.save();
            await TransactionHistoryModel.addTransaction(user._id, admin._id, amount, note, info, global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT, before, after);
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


                if (transaction.type == global.TRANSACTION_TYPE_SHARE_CREDIT || transaction.type == global.TRANSACTION_TYPE_RECEIVE_CREDIT || transaction.type == global.TRANSACTION_TYPE_ADD_MAIN_ACCOUNT || transaction.type == global.TRANSACTION_TYPE_ADD_PROMO_ACCOUNT) {
                    var user = await UserModel.findOne({_id: transaction.info});

                    if (!user) {
                        result.info = {
                            username: user.username,
                            email: user.email,
                            phone: user.phone,
                            name: user.name
                        };
                    }

                }

                if(transaction.type == global.TRANSACTION_TYPE_PAY_POST)
                {



                }

                return result;


            }));


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

            var childId = req.query.id;
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
            return res.json({
                status: 1,
                data: {
                    items: transactions,
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

}
module.exports = TransactionController
