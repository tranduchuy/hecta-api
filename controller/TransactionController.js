var PaymentModel = require('../models/TransactionHistoryModel');
var AccountModel = require('../models/AccountModel');
var TokenModel = require('../models/TokenModel');
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

            var account = await AccountModel.findOne({owner: user._id})

            // var payment = new PaymentModel({
            //
            //     userId: user._id,
            //     adminId: admin._id,
            //     amount: amount,
            //     note: note,
            //     info: info,
            // });
            //
            // await payment.save();


            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    main: 0
                });
            }

            account.main += amount;

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

            var account = await AccountModel.findOne({owner: user._id})

            // var payment = new PaymentModel({
            //
            //     userId: user._id,
            //     adminId: admin._id,
            //     amount: amount,
            //     note: note,
            //     info: info,
            // });
            //
            // await payment.save();


            if (!account) {

                account = new AccountModel({
                    owner: user._id,
                    promo: 0
                });
            }

            account.promo += amount;

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

    }


}
module.exports = TransactionController
