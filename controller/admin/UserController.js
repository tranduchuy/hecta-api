var UserModel = require('../../models/UserModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var ChildModel = require('../../models/ChildModel');
var AccountModel = require('../../models/AccountModel');


var UserController = {

    list: async function (req, res, next) {
        try {

            var token = req.headers.access_token;


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

            var page = req.query.page;
            var username = req.query.username;
            var email = req.query.email;
            var limit = req.query.limit;
            var type = req.query.type;


            if (!page || page < 0) {
                page = 0;
            }
            else {
                page = page * 1;
            }

            if (!limit || limit < 0) {
                limit = global.PAGE_SIZE;
            }
            else {
                limit = limit * 1;
            }

            var query = {role: {$nin: [global.USER_ROLE_ADMIN, global.USER_ROLE_MASTER]}};

            if (type == global.USER_TYPE_COMPANY || type == global.USER_TYPE_PERSONAL) {
                query.type = type;
            }

            if (username) {
                query.username = new RegExp(username, "i");

            }

            if (email) {
                query.email = new RegExp(email, "i");
            }

            var users = await UserModel.find(query).sort({date: -1}).skip((page - 1) * limit).limit(limit);
            let results = await Promise.all(users.map(async user => {

                var account = await AccountModel.findOne({owner: user._id});


                if (!account) {
                    account = new AccountModel({owner: user._id});
                    account = await account.save();
                }

                var accountInfo = {
                    main: account.main,
                    promo: account.promo

                };

                if (user.type == global.USER_TYPE_COMPANY) {
                    var creditTransferred = 0;

                    var children = await ChildModel.find({companyId: user._id});

                    if (children && children.length > 0) {
                        children.forEach(child => {
                            creditTransferred += (child.credit - child.creditUsed);
                        });
                    }

                    accountInfo.creditTransferred = creditTransferred;
                }

                if (user.type == global.USER_TYPE_PERSONAL) {

                    var child = await ChildModel.find({personalId: user._id, status: global.STATUS.CHILD_ACCEPTED});

                    if (child) {
                        accountInfo.credit = child.credit;
                        accountInfo.creditUsed = child.creditUsed;
                    }

                }


                return {

                    id: user._id,
                    email: user.email,
                    username: user.username,
                    status: user.status,
                    phone: user.phone,
                    name: user.name,
                    birthday: user.birthday,
                    gender: user.gender,
                    city: user.city,
                    avatar: user.avatar,
                    district: user.district,
                    ward: user.ward,
                    type: user.type,
                    balance: accountInfo
                };


            }));


            let count = await UserModel.count(query);

            return res.json({
                status: 1,
                data: {
                    items: results,
                    page: page,
                    total: _.ceil(count / limit)
                },
                message: 'request success '
            });

        }
        catch
            (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    },


    status: async function (req, res, next) {

        try {

            var token = req.headers.access_token;

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }

            var admin = await UserModel.findOne({_id: accessToken.user});

            if (!admin || (admin.role != global.USER_ROLE_ADMIN && admin.role != global.USER_ROLE_MASTER)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin not found'
                });
            }

            var id = req.params.id;

            var user = await UserModel.findOne({_id: id});

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not found'
                });
            }


            var status = req.body.status;


            if (status != global.STATUS.ACTIVE && status != global.STATUS.BLOCKED) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'status invalid'
                });
            }

            if (status == global.STATUS.BLOCKED) {
                await TokenModel.remove({user: id});
            }

            user.status = status;
            await user.save();

            return res.json({
                status: 1,
                data: {},
                message: 'request success !'
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
module.exports = UserController
