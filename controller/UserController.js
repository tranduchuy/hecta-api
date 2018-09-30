var EmailValidator = require("email-validator");
var UserModel = require('../models/UserModel');
var _ = require('lodash');
var bcrypt = require('bcrypt');
var AccessToken = require('../utils/AccessToken');
var TokenModel = require('../models/TokenModel');
var ChildModel = require('../models/ChildModel');
var AccountModel = require('../models/AccountModel');
var TransactionHistoryModel = require('../models/TransactionHistoryModel');
var Mailer = require('../commom/Mailer');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var randomstring = require("randomstring");
var HTTP_CODE = require('../config/http-code');
var log4js = require('log4js');
var logger = log4js.getLogger('Controllers');
const NotifyController = require('./NotifyController');
const NotifyContent = require('../config/notify-content');
const Socket = require('../utils/Socket');
const SocketEvents = require('../config/socket-event');
const NotifyTypes = require('../config/notify-type');
var ImageService = require('../services/ImageService');

var forgetPassword = async function (req, res, next) {
    logger.info('UserController::forgetPassword is called');
    var email = (req.body.email || '').toString();

    if (email == '') {
        return res.json({
            status: HTTP_CODE.ERROR,
            message: ['Vui lòng nhập email'],
            data: {}
        });
    }

    try {
        var user = await UserModel.findOne({ email: email });

        if (!user) {
            return res.json({
                status: HTTP_CODE.ERROR,
                message: ['Không tìm thấy người dùng!'],
                data: {}
            });
        }

        user.resetPasswordToken = randomstring.generate(30) + new Date().getTime();
        user.hash_password = bcrypt.hashSync(randomstring.generate(10), 10); // tạo mật khẩu mới bất kì, để tránh trong lúc đang reset mật khẩu, ko có ai xài được nữa

        user.save();

        // xoá tất cả các token của user này
        await TokenModel
            .find({ user: user._id })
            .remove()

        logger.info('UserController::forgetPassword Remove all token of user', user.email);

        Mailer.sendEmailResetPassword(user.email, user.resetPasswordToken, function (err) {
            if (err) {
                logger.error('UserController::forgetPassword cannot send mail: ', err);
                return res.json({
                    status: HTTP_CODE.ERROR,
                    message: [err],
                    data: {}
                });
            }

            return res.json({
                status: HTTP_CODE.SUCCESS,
                message: ['Hệ thống đã gửi 1 link đổi mật khẩu đến email'],
                data: {}
            });
        });
    }
    catch (e) {
        logger.error('UserController::forgetPassword error: ', e);
        return res.json({
            status: HTTP_CODE.ERROR,
            message: [e.message],
            data: {}
        });
    }

}

var resetPassword = async function (req, res, next) {
    logger.info('UserController::resetPassword is called');
    var resetToken = (req.body.resetToken || '').toString();
    var password = (req.body.password || '').toString();

    if (resetToken == '') {
        return res.json({
            status: HTTP_CODE.ERROR,
            message: ['Token đổi mật khẩu không hợp lệ'],
            data: {}
        });
    }

    if (password.length < 6) {
        return res.json({
            status: HTTP_CODE.ERROR,
            message: ['Mật khẩu quá ngắn'],
            data: {}
        });
    }

    try {
        var user = await UserModel.findOne({ resetPasswordToken: resetToken });
        if (!user) {
            return res.json({
                status: HTTP_CODE.ERROR,
                message: ['Token đổi mật khẩu không hợp lệ'],
                data: {}
            });
        }

        user.resetPasswordToken = ''; // xoá reset token
        user.hash_password = bcrypt.hashSync(password, 10);
        user.save();

        logger.info('UserController::resetPassword update password successfully', user.email);
        return res.json({
            status: HTTP_CODE.SUCCESS,
            message: ['Đổi mật khẩu thành công. Vui lòng đăng nhập lại!'],
            data: {}
        });
    }
    catch (e) {
        logger.error('UserController::resetPassword error', e);
        return res.json({
            status: HTTP_CODE.ERROR,
            message: [e.message],
            data: {}
        });
    }
}


var UserController = {

    balance: async function (req, res, next) {
        try {
            var token = req.headers.access_token;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            var account = await AccountModel.findOne({ owner: user._id });


            if (!account) {
                account = new AccountModel({ owner: user._id });
                account = await account.save();
            }

            var accountInfo = {
                main: account.main,
                promo: account.promo

            };

            if (user.type == global.USER_TYPE_COMPANY) {
                var creditTransferred = 0;

                var children = await ChildModel.find({ companyId: user._id });

                if (children && children.length > 0) {
                    children.forEach(child => {
                        creditTransferred += (child.credit - child.creditUsed);
                    });
                }

                accountInfo.creditTransferred = creditTransferred;
            }

            if (user.type == global.USER_TYPE_PERSONAL) {

                var child = await ChildModel.find({ personalId: user._id, status: global.STATUS.CHILD_ACCEPTED });

                if (child) {
                    accountInfo.credit = child.credit;
                    accountInfo.creditUsed = child.creditUsed;
                }

            }

            return res.json({
                status: 1,
                data: accountInfo,
                message: 'request success'
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
    }

    ,

    childDetail: async function (req, res, next) {

        try {
            var token = req.headers.access_token;
            var id = req.params.id;


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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'parent is not exist'
                });
            }

            if (user.type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'parent does not have permission !'
                });
            }


            var person = await UserModel.findOne({ _id: id });
            if (!person) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'person is not exist'
                });
            }

            if (person.type != global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'person invalid !'
                });
            }

            var child = await ChildModel.findOne({
                companyId: user._id,
                personalId: person._id,
                status: global.STATUS.CHILD_ACCEPTED
            });

            if (!child) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'relation invalid'
                });
            }

            return res.json({
                status: 1,
                data: {

                    username: person.username,
                    id: person._id,
                    name: person.name,
                    phone: person.phone,
                    email: person.email
                    // - name
                    // - fullname
                    // - email
                    // - phoneNumber

                },
                message: 'request success'
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
    }
    ,

    creditShare: async function (req, res, next) {
        logger.info('UserController::creditShare is called');
        try {
            let { amount, note, id } = req.body;
            const user = req.user;
            const person = await UserModel.findOne({ _id: id });
            if (!person) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'person is not exist'
                });
            }

            if (person.type !== global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: HTTP_CODE.ERROR,
                    data: {},
                    message: 'Person invalid !'
                });
            }

            let child = await ChildModel.findOne({
                companyId: user._id,
                personalId: person._id,
                status: global.STATUS.CHILD_ACCEPTED
            });

            if (!child) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: {},
                    message: 'relation in valid'
                });
            }

            if (isNaN(amount)) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: { amount: amount },
                    message: 'Amount is invalid'
                });
            }

            amount = parseInt(amount, 0);

            if (amount < 0) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: { amount: amount },
                    message: 'Amount is invalid'
                });
            }

            let sourceAccount = await AccountModel.findOne({ owner: user._id });

            if (!sourceAccount) {
                sourceAccount = new AccountModel({
                    owner: user._id
                });

                sourceAccount = await sourceAccount.save();
            }

            if (amount > 0) {
                let sharedCredit = 0;
                const sharedChildren = await ChildModel.find({ companyId: user._id });

                if (sharedChildren) {
                    sharedChildren.forEach(sharedChild => {
                        sharedCredit += sharedChild.credit;
                    });
                }

                if (sourceAccount.main - sharedCredit < amount) {
                    return res.json({
                        status: HTTP_CODE.ERROR,
                        data: {},
                        message: 'account not enough'
                    });
                }
            } else {
                if (child.credit - child.creditUsed < amount) {
                    return res.json({
                        status: HTTP_CODE.ERROR,
                        data: {},
                        message: 'credit left not enough'
                    });
                }
            }

            const accountChild = await AccountModel({ owner: child.personalId });
            const beforeUser = {
                credit: child.credit,
                main: accountChild ? accountChild.main : 0,
                promo: accountChild ? accountChild.promo : 0
            };
            const beforeParent = {
                credit: 0,
                main: sourceAccount.main,
                promo: sourceAccount.promo
            };

            child.credit += amount;
            child.creditHistory.push({ date: Date.now(), amount: amount, note: note });

            sourceAccount.main -= amount;

            await sourceAccount.save();

            const afterUser = {
                credit: child.credit,
                main: accountChild ? accountChild.main : 0,
                promo: accountChild ? accountChild.promo : 0
            };

            const afterParrent = {
                credit: 0,
                main: sourceAccount.main,
                promo: sourceAccount.promo
            };

            await TransactionHistoryModel.addTransaction(child.personalId, undefined, amount, note, child.companyId, global.TRANSACTION_TYPE_RECEIVE_CREDIT, beforeUser, afterUser);
            await TransactionHistoryModel.addTransaction(child.companyId, undefined, amount, note, child.personalId, global.TRANSACTION_TYPE_SHARE_CREDIT, beforeParent, afterParrent);
            await child.save();

            // notify
            const notifyParams = {
                fromUserId: child.companyId,
                toUserId: child.personalId,
                title: NotifyContent.CreditShare.Title,
                content: NotifyContent.CreditShare.Content,
                type: NotifyTypes.CHANGE_TRANSACTION,
                params: {
                    before: beforeUser,
                    after: afterUser
                }
            };
            NotifyController.createNotify(notifyParams);

            // send Socket
            notifyParams.toUserIds = [notifyParams.toUserId];
            delete notifyParams.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, notifyParams);


            return res.json({
                status: HTTP_CODE.SUCCESS,
                data: child,
                message: 'Request success'
            });
        } catch (e) {
            logger.error('UserController::creditShare::error', e);
            return next(e);
        }
    },


    registerChild: async function (req, res, next) {


        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var phone = req.body.phone;
        var name = req.body.name;
        var birthday = req.body.birthday;
        var gender = req.body.gender;
        var city = req.body.city;
        var district = req.body.district;
        var ward = req.body.ward;
        var type = req.body.type;


        try {

            var token = req.headers.access_token;

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


            var parrent = await UserModel.findOne({ _id: accessToken.user });

            if (!parrent) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'parrent is not exist'
                });
            }

            if (parrent.type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'parrent does not have permission !'
                });
            }

            if (!EmailValidator.validate(email)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'email : "' + email + '" is invalid'
                });
            }

            if (!password || password.length < 6) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'password : "' + password + '" is invalid'
                });
            }

            if (!phone || phone.length < 6) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'phone : "' + phone + '" is invalid'
                });

            }

            if (!name || name.length < 3) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'name : "' + name + '" is invalid'
                });

            }

            if (type != global.USER_TYPE_PERSONAL && type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'type : "' + type + '" is invalid'
                });

            }


            if (!username || username.length < 6) {
                return res.json({
                    status: 1,
                    data: false,
                    message: 'username invalid'
                });

            }


            var user = await UserModel.findOne({ username: username });

            if (user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'username : "' + username + '" is duplicate'
                });

            }

            user = new UserModel();
            user.username = username;
            user.email = email;
            user.phone = phone;
            user.name = name;
            user.birthday = birthday;
            user.gender = gender;
            user.city = city;
            user.district = district;
            user.ward = ward;
            user.type = type;
            user.hash_password = bcrypt.hashSync(password, 10);


            await user.save();

            let child = new ChildModel({
                companyId: parrent._id,
                personalId: user._id,
                status: global.STATUS.CHILD_ACCEPTED
            });

            await child.save();

            // create notify
            const notifyParam = {
                fromUserId: parrent._id,
                toUserId: user._id,
                title: NotifyContent.RequestChild.Title,
                content: NotifyContent.RequestChild.Content,
                type: NotifyTypes.PARENT_CHILD.REQUEST,
                params: {}
            };

            await NotifyController.createNotify(notifyParam);

            // send Socket
            const socketContents = { ...notifyParam, toUserIds: [user._id] };
            delete socketContents.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, socketContents);

            return res.json({
                status: 1,
                data: child,
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
    ,

    childRemove: async function (req, res, next) {

        try {
            var id = req.params.id;
            var user = req.user;


            if (user.type == global.USER_TYPE_COMPANY && !ObjectId.isValid(id)) {
                return res.json({
                    status: HTTP_CODE.ERROR,
                    data: {},
                    message: 'user does not have permission !'
                });
            }

            var child = undefined;

            if (user.type == global.USER_TYPE_COMPANY) {
                child = await ChildModel.findOne({
                    companyId: user._id,
                    personalId: id,
                    status: global.STATUS.CHILD_ACCEPTED

                });

            }
            if (user.type == global.USER_TYPE_PERSONAL) {

                child = await ChildModel.findOne({
                    personalId: user._id,
                    status: global.STATUS.CHILD_ACCEPTED
                });
            }

            if (!child) {
                return res.json({
                    status: HTTP_CODE.ERROR,
                    data: {},
                    message: 'relation not found !'
                });
            }


            var parentAccount = await AccountModel.findOne({ owner: child.companyId });
            if (!parentAccount) {
                parentAccount = new AccountModel({
                    owner: child.companyId,
                    main: 0
                });
            }

            var parentBefore = {
                main: parentAccount.main,
                promo: parentAccount.promo,
                credit: 0

            };

            var childAccount = await AccountModel.findOne({ owner: child.personalId });
            if (!childAccount) {
                childAccount = new AccountModel({
                    owner: child.personalId,
                    main: 0
                });
                await childAccount.save();
            }


            var childBefore = {
                main: childAccount.main,
                promo: childAccount.promo,
                credit: child.credit

            };

            parentAccount.main += child.credit;

            child.status = global.STATUS.CHILD_NONE;
            child.credit = 0;


            var parentAfter = {
                main: parentAccount.main,
                promo: parentAccount.promo,
                credit: 0
            };

            var childAfter = {
                main: childAccount.main,
                promo: childAccount.promo,
                credit: 0
            };
            await parentAccount.save();
            await child.save();

            await TransactionHistoryModel.addTransaction(child.companyId, undefined, childBefore.credit, "", child.personalId, global.TRANSACTION_TYPE_TAKE_BACK_MONEY, parentBefore, parentAfter);
            await TransactionHistoryModel.addTransaction(child.personalId, undefined, childBefore.credit, "", child.companyId, global.TRANSACTION_TYPE_GIVE_MONEY_BACK, childBefore, childAfter);

            // notify
            const notifyParams = {
                fromUserId: child.companyId,
                toUserId: child.personalId,
                title: NotifyContent.ReturnMoneyToCompany.Title,
                content: NotifyContent.ReturnMoneyToCompany.Content,
                type: NotifyTypes.PARENT_CHILD.REMOVE,
                params: {}
            };
            NotifyController.createNotify(notifyParams);

            // send socket
            notifyParams.toUserIds = [notifyParams.toUserId];
            delete notifyParams.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, notifyParams);

            return res.json({
                status: 1,
                data: child,
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
    ,

    childResponse: async function (req, res, next) {
        try {
            var token = req.headers.access_token;
            var id = req.params.id;
            var status = req.body.status;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            var child = await ChildModel.findOne({
                _id: id
            });

            if (!child) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'request not exist'
                });
            }

            if (status == global.STATUS.CHILD_ACCEPTED || status == global.STATUS.CHILD_REJECTED) {
                child.status = status;
            }

            await child.save();

            const { Title, Content } = status == global.STATUS.CHILD_ACCEPTED ?
                NotifyContent.ResponseChildStatusAccepted :
                NotifyContent.ResponseChildStatusRejected;

            const notifyParam = {
                fromUserId: user._id,
                toUserId: child.companyId,
                title: Title,
                content: Content,
                type: NotifyTypes.PARENT_CHILD.RESPONSE,
                params: {
                    status // show status of child's response
                }
            };
            await NotifyController.createNotify(notifyParam);

            const socketContents = { ...notifyParam, toUserIds: [child.companyId] };
            delete socketContents.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, socketContents);

            return res.json({
                status: 1,
                data: child,
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
    ,


    childRequest: async function (req, res, next) {

        try {
            var token = req.headers.access_token;
            var id = req.params.id;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (user.type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }


            var person = await UserModel.findOne({ _id: id });
            if (!person) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'person is not exist'
                });
            }

            if (person.type != global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'person invalid !'
                });
            }

            var child = await ChildModel.findOne({
                companyId: user._id,
                personalId: person._id,
                // status: {$in: [global.STATUS.CHILD_WAITING, global.STATUS.CHILD_ACCEPTED]}
            });
            if (child && (child.status == global.STATUS.CHILD_WAITING || child.status == global.STATUS.CHILD_ACCEPTED)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'request already sent'
                });
            }

            if (!child) {
                child = new ChildModel({
                    companyId: user._id,
                    personalId: person._id
                });
            }

            child.status = global.STATUS.CHILD_WAITING;

            await child.save();

            const notifyParam = {
                fromUserId: user._id,
                toUserId: person._id,
                title: NotifyContent.RequestChild.Title,
                content: NotifyContent.RequestChild.Content,
                type: NotifyTypes.PARENT_CHILD.REQUEST,
                params: {}
            };
            await NotifyController.createNotify(notifyParam);

            const socketContents = { ...notifyParam, toUserIds: [person._id] };
            delete socketContents.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, socketContents);

            return res.json({
                status: 1,
                data: child,
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
    ,


    requestList: async function (req, res, next) {
        try {

            var token = req.headers.access_token;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (user.type != global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }

            var parrents = await ChildModel.find({ personalId: user._id, status: global.STATUS.CHILD_WAITING });

            let results = await Promise.all(parrents.map(async parrent => {

                let company = await UserModel.findOne({ _id: parrent.companyId });


                return {
                    id: parrent._id,
                    parent: {
                        id: company ? company._id : 'unknown',
                        username: company ? company.username : 'unknown',
                        email: company ? company.email : 'unknown',
                        name: company ? company.name : 'unknown'
                    },
                    status: company.status
                };


            }));

            return res.json({
                status: 1,
                data: results,
                message: 'request success !'
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
    }
    ,

    childList: async function (req, res, next) {
        try {
            var token = req.headers.access_token;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (user.type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }

            var children = await ChildModel.find({
                companyId: user._id,
                status: { $in: [global.STATUS.CHILD_WAITING, global.STATUS.CHILD_ACCEPTED, global.STATUS.CHILD_REJECTED] }
            });

            let results = await Promise.all(children.map(async child => {

                let personal = await UserModel.findOne({ _id: child.personalId });

                var account = await AccountModel.findOne({ owner: child.personalId });


                if (!account) {
                    account = new AccountModel({ owner: child.personalId });
                    account = await account.save();
                }

                var accountInfo = {
                    main: account.main,
                    promo: account.promo,
                    credit: child.credit,
                    creditUsed: child.creditUsed

                };


                return {
                    id: personal ? personal._id : 'unknown',
                    username: personal ? personal.username : 'unknown',
                    email: personal ? personal.email : 'unknown',
                    name: personal ? personal.name : 'unknown',
                    status: child.status,
                    balance: accountInfo
                };


            }));

            return res.json({
                status: 1,
                data: results,
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
    ,

    findUserByEmail: async function (req, res, next) {

        try {

            var token = req.headers.access_token;
            var email = req.params.email;

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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

            if (user.type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }

            var personal = await UserModel.findOne({ email: email });
            if (!personal || personal.type != global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'email not found !'
                });
            }

            var child = await ChildModel.findOne({ companyId: user._id, personalId: personal._id });

            var transfer = undefined;


            return res.json({
                status: 1,
                data: {
                    id: personal._id,
                    username: personal.username,
                    email: personal.email,
                    name: personal.name,
                    status: !child ? global.STATUS.CHILD_NONE : child.status,
                    transfer: transfer && transfer.sum ? transfer.sum : 0
                },
                message: 'request success'
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
    ,

    highlight: async function (req, res, next) {

        try {


            let users = await
                UserModel.find({ phone: { $ne: null }, avatar: { $ne: null } }).sort({ date: -1 }).limit(10);

            let results = await
                Promise.all(users.map(async user => {


                    let result = {
                        id: user._id,

                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        name: user.name,
                        birthday: user.birthday,
                        gender: user.gender,
                        city: user.city,
                        avatar: user.avatar,
                        district: user.district,
                        ward: user.ward,
                        type: user.type

                    };


                    return result;

                }));


            return res.json({
                status: 1,
                data: results,
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

    ,
    check: async function (req, res, next) {
        var username = req.body.username;
        var email = req.body.email;

        if (!username && !email) {
            return res.json({
                status: 0,
                data: {},
                message: 'put email or username in body of request :)'
            });
        }

        if (username && username.length < 6) {
            return res.json({
                status: 1,
                data: false,
                message: 'user invalid'
            });

        }

        if (email && !EmailValidator.validate(email)) {

            return res.json({
                status: 1,
                data: false,
                message: 'email invalid'
            });

        }

        try {

            let user = await UserModel.findOne(username ? { username: username } : { email: email });


            if (user) {
                return res.json({
                    status: 1,
                    data: false,
                    message: (username ? 'username' : 'email') + ' duplicated'
                });
            }
            else {
                return res.json({
                    status: 1,
                    data: true,
                    message: (username ? 'username' : 'email') + ' available'
                });
            }


        }
        catch (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }

    }
    ,
    login: async function (req, res, next) {

        var username = req.body.username;
        var password = req.body.password;

        if (!password || password.length < 6) {
            return res.json({
                status: 0,
                data: {},
                message: 'password : "' + password + '" is invalid'
            });
        }

        if (!username || username.length < 6) {
            return res.json({
                status: 0,
                data: {},
                message: 'username invalid'
            });
        }

        var user = await UserModel.findOne({
            $or: [{ username: username }, { email: username }]
        });

        if (!user) {
            return res.json({
                status: 0,
                message: 'Username : "' + username + '" is not exist',
                data: {}
            });
        }

        if (user.status != global.STATUS.ACTIVE || user.role != global.USER_ROLE_ENDUSER) {
            return res.json({
                status: 0,
                error: user.status,
                data: {},
                message: 'status is not active or role invalid!'
            });
        }

        if (await bcrypt.compareSync(password, user.hash_password)) {

            var result = {};
            var requestCount = await ChildModel.count({ personalId: user._id, status: global.STATUS.CHILD_WAITING });

            var account = await AccountModel.findOne({ owner: user._id });


            if (!account) {
                account = new AccountModel({ owner: user._id });
                account = await account.save();
            }

            var accountInfo = {
                main: account.main,
                promo: account.promo

            };

            if (user.type == global.USER_TYPE_COMPANY) {
                var creditTransferred = 0;

                var children = await ChildModel.find({ companyId: user._id, status: global.STATUS.CHILD_ACCEPTED });

                if (children && children.length > 0) {
                    children.forEach(child => {
                        creditTransferred += (child.credit - child.creditUsed);
                    });
                }

                accountInfo.creditTransferred = creditTransferred;
            }

            if (user.type == global.USER_TYPE_PERSONAL) {

                var child = await ChildModel.findOne({ personalId: user._id, status: global.STATUS.CHILD_ACCEPTED });

                if (child) {
                    accountInfo.credit = child.credit;
                    accountInfo.creditUsed = child.creditUsed;
                }

            }

            result.username = user.username;
            result.email = user.email;
            result.phone = user.phone;
            result.name = user.name;
            result.birthday = user.birthday;
            result.gender = user.gender;
            result.city = user.city;
            result.district = user.district;
            result.ward = user.ward;
            result.type = user.type;
            result.id = user._id;
            result.avatar = user.avatar;
            result.balance = accountInfo;
            result.requestCount = requestCount;
            result.token = AccessToken.generate(user._id);

            return res.json({
                status: 1,
                data: result,
                message: 'login success !'
            });


        } else {
            return res.json({
                status: 0,
                data: {},
                message: 'incorrect password !'
            });
        }

    },

    resendCofirm: async function (req, res, next) {

        var email = req.body.email;
        if (!email) {
            return res.json({
                status: 0,
                data: {},
                message: 'email empty'
            });
        }

        var user = await UserModel.findOne({ email: email, status: global.STATUS.PENDING_OR_WAIT_COMFIRM });
        if (!user) {
            return res.json({
                status: 0,
                data: {},
                message: 'user not found or invalid status'
            });
        }
        Mailer.sendConfirmEmail(user.email, user.confirmToken);

        return res.json({
            status: 1,
            data: {},
            message: 'request success'
        });


    },

    confirm: async function (req, res, next) {
        var token = req.body.token;

        try {
            if (!token || token.length < 30) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'token invalid'
                });
            }

            var user = await UserModel.findOne({ confirmToken: token });

            if (!user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'token not found'
                });
            }


            user.status = global.STATUS.ACTIVE;

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
    , register: async function (req, res, next) {


        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var phone = req.body.phone;
        var name = req.body.name;
        var birthday = req.body.birthday;
        var gender = req.body.gender;
        var city = req.body.city;
        var district = req.body.district;
        var ward = req.body.ward;
        var type = req.body.type;


        try {


            if (!EmailValidator.validate(email)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'email : "' + email + '" is invalid'
                });
            }

            if (!password || password.length < 6) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'password : "' + password + '" is invalid'
                });
            }

            if (!phone || phone.length < 6) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'phone : "' + phone + '" is invalid'
                });

            }

            if (!name || name.length < 3) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'name : "' + name + '" is invalid'
                });

            }

            if (type != global.USER_TYPE_PERSONAL && type != global.USER_TYPE_COMPANY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'type : "' + type + '" is invalid'
                });

            }


            if (!username || username.length < 6) {
                return res.json({
                    status: 1,
                    data: false,
                    message: 'username invalid'
                });

            }


            var user = await UserModel.findOne({ username: username });

            if (user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'username : "' + username + '" is duplicate'
                });

            }

            user = await UserModel.findOne({ email: email });

            if (user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'email : "' + email + '" is duplicate'
                });

            }

            user = new UserModel();
            user.username = username;
            user.email = email;
            user.phone = phone;
            user.name = name;
            user.birthday = birthday;
            user.gender = gender;
            user.city = city;
            user.district = district;
            user.ward = ward;
            user.type = type;
            user.hash_password = bcrypt.hashSync(password, 10);
            user.confirmToken = randomstring.generate(30) + new Date().getTime();


            Mailer.sendConfirmEmail(email, user.confirmToken);

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
    ,

    update: async function (req, res, next) {

        try {

            var token = req.headers.access_token;
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


            var user = await UserModel.findOne({ _id: accessToken.user });

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }


            var email = req.body.email;
            var password = req.body.password;
            var name = req.body.name;
            var phone = req.body.phone;
            var birthday = req.body.birthday;
            var gender = req.body.gender;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var type = req.body.type;
            var avatar = req.body.avatar;
            ImageService.putUpdateImage([user.avatar], [avatar]);

            var oldPassword = req.body.oldPassword;


            if (email) {
                if (!EmailValidator.validate(email)) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'email : "' + email + '" is invalid'
                    });
                }
                user.email = email;
            }

            if (password) {
                if (!password || password.length < 6) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'password : "' + password + '" is invalid'
                    });
                }
                if (!oldPassword || await bcrypt.compareSync(oldPassword, user.hash_password)) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'oldPassword : "' + oldPassword + '" is incorrect'
                    });
                }


                user.password = bcrypt.hashSync(password, 10);
            }

            if (phone) {
                if (phone.length < 6) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'phone : "' + phone + '" is invalid'
                    });

                }
                user.phone = phone;
            }

            if (name) {
                if (name.length < 3) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'name : "' + name + '" is invalid'
                    });

                }
                user.name = name;
            }
            if (birthday) {
                user.birthday = birthday;
            }

            if (avatar) {
                user.avatar = avatar;
            }

            if (gender != undefined) {

                user.gender = gender;
            }
            if (city) {
                user.city = city;
            }
            if (district) {
                user.district = district;
            }
            if (ward) {
                user.ward = ward;
            }
            if (type) {
                if (type != global.USER_TYPE_PERSONAL && type != global.USER_TYPE_COMPANY) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'type : "' + type + '" is invalid'
                    });

                }
                user.type = type;
            }

            user = await user.save();

            user.hash_password = undefined;

            return res.json({
                status: 1,
                data: user,
                message: 'request success ! '
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

    forgetPassword: forgetPassword,
    resetPassword: resetPassword
}
module.exports = UserController
