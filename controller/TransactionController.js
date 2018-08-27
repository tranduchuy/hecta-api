var PaymentModel = require('../models/TransactionHistoryModel');
var AccountModel = require('../models/AccountModel');
var TransactionHistoryModel = require('../models/TransactionHistoryModel');
var TokenModel = require('../models/TokenModel');
var ChildModel = require('../models/ChildModel');
var UserModel = require('../models/UserModel');
var _ = require('lodash');

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

            var accessToken = await  TokenModel.findOne({token: token});

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

            var account = await AccountModel.findOne({owner: user._id})

            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    main: 0
                });
            }


            let child = await ChildModel({status: global.STATUS.ACTIVE, personalId: user._id});
            var transaction = new TransactionHistoryModel({

                userId: userId,
                adminId: admin._id,
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

            var accessToken = await  TokenModel.findOne({token: token});

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
            var transaction = new TransactionHistoryModel({

                userId: userId,
                adminId: admin._id,
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
            var token = req.headers.access_token;
            var page = req.query.page;

            if (!token) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token empty !'
                });
            }

            var accessToken = await  TokenModel.findOne({token: token});

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


            if (!page || page < 1) {
                page = 1;
            }

            let transactions = await TransactionHistoryModel.find({userId: user._id}).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
            let count = await TransactionHistoryModel.count({userId: user._id});
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

            var accessToken = await  TokenModel.findOne({token: token});

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

            let transactions = await TransactionHistoryModel.find({userId: id}).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
            let count = await TransactionHistoryModel.count({userId: id});
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
