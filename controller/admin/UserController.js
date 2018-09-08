var UserModel = require('../../models/UserModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var ChildModel = require('../../models/ChildModel');
var AccountModel = require('../../models/AccountModel');
var log4js = require('log4js');
var logger = log4js.getLogger('Controllers');
var HTTP_CODE = require('../../config/http-code');

var changeUserType = async function (req, res, next) {
    var newType = req.body.type;
    logger.info('AdminUserController::changeUserType is called');

    try {
        var targetUser = await UserModel.findOne({_id: req.params.id});
        if (!targetUser) {
            logger.error('AdminUserController::changeUserType User not found: ' + req.params.id);

            return res.json({
                status: HTTP_CODE.BAD_REQUEST,
                message: ['User not found'],
                data: {}
            });
        }

        if (targetUser.status == global.STATUS.BLOCKED || targetUser.status == global.STATUS.DELETE) {
            logger.error('AdminUserController::changeUserType method not allow. User status is: ' + req.user.status);

            return res.json({
                status: HTTP_CODE.BAD_REQUEST,
                message: ['Method not allow'],
                data: {}
            });
        }

        if (targetUser.type == parseInt(newType, 0)) {
            logger.error('AdminUserController::changeUserType method not allow. Type not change: ' + newType);

            return res.json({
                status: HTTP_CODE.BAD_REQUEST,
                message: ['Type not change'],
                data: {}
            });
        }

        if (targetUser.type == global.USER_TYPE_COMPANY) {
            var children = await ChildModel.find({companyId: targetUser._id});

            if (children.length != 0) {
                logger.error('AdminUserController::changeUserType have children, can not change type: ' + newType);

                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    message: ['Have children. Cannot change type'],
                    data: {}
                });
            }
        } else if (targetUser.type == global.USER_TYPE_PERSONAL) {
            var parent = await ChildModel.find({personalId: targetUser._id});

            if (parent.length != 0) {
                logger.error('AdminUserController::changeUserType have parents, can not change type: ' + newType);

                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    message: ['Have parents. Cannot change type'],
                    data: {}
                });
            }
        }


        targetUser.type = parseInt(newType, 0);
        await targetUser.save();
    }
    catch (e) {
        logger.error("AdminUserController::changeUserType something error: " + JSON.stringify(e));

        return res.json({
            status: HTTP_CODE.BAD_REQUEST,
            message: [e],
            data: {}
        });
    }

    return res.json({
        status: HTTP_CODE.SUCCESS,
        message: ['Update user type successfully'],
        data: {}
    });
}


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


    update: async function (req, res, next) {

        try {

            var token = req.headers.access_token;

            var accessToken = await TokenModel.findOne({token: token});

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


            // var status = parseInt(req.body.status, 0);
            // var expirationDate = parseInt(req.body.expirationDate, 0);

            var status = req.body.status;

            if (status != undefined && status != null) {
                var validStatues = [
                    global.STATUS.ACTIVE,
                    global.STATUS.BLOCKED,
                    global.STATUS.DELETE
                ];

                if (validStatues.indexOf(status) === -1) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'Status invalid'
                    });
                }

                if (status == global.STATUS.BLOCKED) {
                    await TokenModel.remove({user: id});
                }

                user.status = status;
            }

            var expirationDate = req.body.expirationDate;

            if (expirationDate != undefined && expirationDate != null) {

                if(expirationDate < Date.now())
                {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'ExpirationDate invalid'
                    });
                }
                user.expirationDate = expirationDate;
            }


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
    },

    changeUserType: changeUserType
}
module.exports = UserController
