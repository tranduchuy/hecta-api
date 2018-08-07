var EmailValidator = require("email-validator");
var UserModel = require('../models/UserModel');
var _ = require('lodash');
var bcrypt = require('bcrypt');
var AccessToken = require('../utils/AccessToken');
var TokenModel = require('../models/TokenModel');
var ChildModel = require('../models/ChildModel');
var AccountModel = require('../models/AccountModel');
var Mailer = require('../commom/Mailer');

var randomstring = require("randomstring");


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

            var query = {};

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

                    var child = await ChildModel.find({personalId: user._id, status: global.CHILD_STATUS_ACCEPTED});

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
    }

    ,

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

            if (!user) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'user is not exist'
                });
            }

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

                var child = await ChildModel.find({personalId: user._id, status: global.CHILD_STATUS_ACCEPTED});

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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


            var person = await UserModel.findOne({_id: id});
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
                status: global.CHILD_STATUS_ACCEPTED
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

        try {
            var token = req.headers.access_token;
            var amount = req.body.amount;
            var note = req.body.note;
            var id = req.params.id;

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


            var user = await UserModel.findOne({_id: accessToken.user});

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


            var person = await UserModel.findOne({_id: id});
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
                status: global.CHILD_STATUS_ACCEPTED
            });

            if (!child) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'relation in valid'
                });
            }

            if (!_.isNumber(amount) || amount == 0) {
                return res.json({
                    status: 0,
                    data: {amount: amount},
                    message: 'amount is invalid'
                });
            }

            var sourceAccount = await AccountModel.find({owner: user._id});

            if (!sourceAccount) {
                sourceAccount = new AccountModel({

                    owner: user._id

                });
                sourceAccount = sourceAccount.save();
            }

            if (amount > 0) {

                var sharedCredit = 0;

                var sharedChildren = await ChildModel.find({companyId: user._id});


                if (sharedChildren) {
                    sharedChildren.forEach(sharedChild => {
                        sharedCredit += sharedChild.credit;
                    });
                }

                if (sourceAccount.main - sharedCredit < amount) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'account not enough'
                    });
                }

            } else {

                if (child.credit - child.creditUsed < amount) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'credit left not enough'
                    });
                }

            }

            child.credit += amount;
            child.creditHistory.push({date: Date.now(), amount: amount, note: note});

            sourceAccount.main -= sharedCredit;
            await sourceAccount.save();

            await child.save();
            return res.json({
                status: 1,
                data: child,
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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var parrent = await UserModel.findOne({_id: accessToken.user});

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


            var user = await UserModel.findOne({username: username});

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
                status: global.CHILD_STATUS_ACCEPTED
            });

            await child.save();


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
            var token = req.headers.access_token;
            var id = req.params.id;

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


            var user = await UserModel.findOne({_id: accessToken.user});

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


            var person = await UserModel.findOne({_id: id});
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
                // status: {$in: [global.CHILD_STATUS_ACCEPTED, global.CHILD_STATUS_WAITING]}
            });
            if (!child) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'child not found'
                });
            }

            child.status = global.CHILD_STATUS_NONE;

            await child.save();

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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

            if (status == global.CHILD_STATUS_ACCEPTED || status == global.CHILD_STATUS_REJECTED) {
                child.status = status;
            }

            await child.save();

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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


            var person = await UserModel.findOne({_id: id});
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
                // status: {$in: [global.CHILD_STATUS_WAITING, global.CHILD_STATUS_ACCEPTED]}
            });
            if (child && (child.status == global.CHILD_STATUS_WAITING || child.status == global.CHILD_STATUS_ACCEPTED)) {
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

            child.status = global.CHILD_STATUS_WAITING;

            await child.save();

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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

            var parrents = await ChildModel.find({personalId: user._id, status: global.CHILD_STATUS_WAITING});

            let results = await Promise.all(parrents.map(async parrent => {

                let company = await  UserModel.findOne({_id: parrent.companyId});


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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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
                status: {$in: [global.CHILD_STATUS_WAITING, global.CHILD_STATUS_ACCEPTED, global.CHILD_STATUS_REJECTED]}
            });

            let results = await Promise.all(children.map(async child => {

                let personal = await  UserModel.findOne({_id: child.personalId});

                var account = await AccountModel.findOne({owner: child.personalId});


                if (!account) {
                    account = new AccountModel({owner: child.personalId});
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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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

            var personal = await UserModel.findOne({email: email});
            if (!personal || personal.type != global.USER_TYPE_PERSONAL) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'email not found !'
                });
            }

            var child = await ChildModel.findOne({companyId: user._id, personalId: personal._id});

            var transfer = undefined;

            // if (child && child.status == global.CHILD_STATUS_ACCEPTED) {
            //
            //
            //     transfer = await TransferModel.aggregate(
            //         [
            //             {
            //                 $group: {
            //                     _id: "$childId",
            //                     mountCount: {$sum: {$cond: [{$eq: ["$childId", child._id]}, 0, 1]}},
            //                     summarizedMount: {$sum: "$mount"}
            //                 }
            //             },
            //             {
            //                 $project: {
            //                     sum: "$summarizedMount",
            //                 }
            //             }
            //         ]
            //     );
            //
            //     console.log('transfer ', transfer);
            // }


            return res.json({
                status: 1,
                data: {
                    id: personal._id,
                    username: personal.username,
                    email: personal.email,
                    name: personal.name,
                    status: !child ? global.CHILD_STATUS_NONE : child.status,
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
                UserModel.find({phone: {$ne: null}, avatar: {$ne: null}}).sort({date: -1}).limit(10);

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

            let user = await UserModel.findOne(username ? {username: username} : {email: email});


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

        var user = await UserModel.findOne({username: username});

        if (user.status != global.USER_STATUS_ACTIVE) {
            return res.json({
                status: 0,
                error: user.status,
                data: {},
                message: 'status is not active !'
            });
        }

        if (!user) {
            return res.json({
                status: 0,
                data: {},
                message: 'username : "' + username + '" is not exist'
            });

        }

        if (await bcrypt.compareSync(password, user.hash_password)) {

            var result = {};
            var requestCount = await ChildModel.count({personalId: user._id, status: global.CHILD_STATUS_WAITING});

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

                var child = await ChildModel.find({personalId: user._id, status: global.CHILD_STATUS_ACCEPTED});

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

        var user = await UserModel.findOne({email: email, status: global.USER_STATUS_WAIT_COMFIRM});
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

            var user = await UserModel.find({confirmToken: token});

            if (!user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'token not found'
                });
            }


            user.status = global.USER_STATUS_ACTIVE;

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


            var user = await UserModel.findOne({username: username});

            if (user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'username : "' + username + '" is duplicate'
                });

            }

            user = await UserModel.findOne({email: email});

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

            var accessToken = await  TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }


            var user = await UserModel.findOne({_id: accessToken.user});

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
            console.log('gender 1', gender);

            if (gender != undefined) {

                console.log('gender 2', gender);
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


    updateAdmin: async function (req, res, next) {

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


            var id = req.params.id;

            var user = await UserModel.findOne({_id: id});

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
            // var oldPassword = req.body.oldPassword;
            var status = req.body.status;


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
                // if (!oldPassword || await bcrypt.compareSync(oldPassword, user.hash_password)) {
                //     return res.json({
                //         status: 0,
                //         data: {},
                //         message: 'oldPassword : "' + oldPassword + '" is incorrect'
                //     });
                // }


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

            if (user.status != global.USER_STATUS_WAIT_COMFIRM && (status == global.STATUS_ACTIVE || status == global.USER_STATUS_BLOCKED)) {
                user.status = status;
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
    }
}
module.exports = UserController
