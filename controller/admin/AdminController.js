var EmailValidator = require("email-validator");
var BCrypt = require('bcrypt');

var AccessToken = require('../../utils/AccessToken');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');
var _ = require('lodash');

var AdminController = {


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

        if (!user || user.status != global.STATUS.ACTIVE || (user.role != global.USER_ROLE_MASTER && user.role != global.USER_ROLE_ADMIN) || await !BCrypt.compareSync(password, user.hash_password)) {
            return res.json({
                status: 0,
                data: {},
                message: 'login fail '
            });

        }


        return res.json({
            status: 1,
            data: {
                username: user.username,
                email: user.email,
                phone: user.phone,
                name: user.name,
                birthday: user.birthday,
                gender: user.gender,
                city: user.city,
                district: user.district,
                ward: user.ward,
                type: user.type,
                id: user._id,
                avatar: user.avatar,
                token: AccessToken.generate(user._id)
            },
            message: 'login success !'
        });


    },
    update: async function (req, res, next) {

        try {

            var token = req.headers.accesstoken;
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
                if (!oldPassword || await !BCrypt.compareSync(oldPassword, user.hash_password)) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'oldPassword : "' + oldPassword + '" is incorrect'
                    });
                }
                user.password = BCrypt.hashSync(password, 10);
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

            await user.save();

            return res.json({
                status: 1,
                data: {},
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

    create: async function (req, res, next) {

        try {


            var token = req.headers.accesstoken;


            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access_token invalid'
                });
            }

            var master = await UserModel.findOne({_id: accessToken.user});


            if (!master || master.role != global.USER_ROLE_MASTER) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'master invalid'
                });
            }

            var username = req.body.username;
            var email = req.body.email;
            var password = req.body.password;
            var phone = req.body.phone;
            var name = req.body.name;


            if (!EmailValidator.validate(email) || !password || password.length < 6 || !phone || phone.length < 6 || !name || name.length < 3 || !username || username.length < 6) {
                return res.json({
                    status: 0,
                    data: {
                        email: email,
                        password: password,
                        phone: phone,
                        name: name,
                        username: username
                    },
                    message: 'body invalid'
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
            user.status = global.STATUS.ACTIVE;
            user.role = global.USER_ROLE_ADMIN;
            user.hash_password = BCrypt.hashSync(password, 10);

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

    status: async function (req, res, next) {

        try {


            var token = req.headers.accesstoken;


            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access_token invalid'
                });
            }

            var master = await UserModel.findOne({_id: accessToken.user});


            if (!master || master.role != global.USER_ROLE_MASTER) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'master invalid'
                });
            }


            var id = req.params.id;

            var admin = await UserModel.findOne({_id: id});

            if (!admin) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin not found'
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

            admin.status = status;
            await admin.save();

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

    list: async function (req, res, next) {

        try {


            var token = req.headers.accesstoken;


            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access_token invalid'
                });
            }

            var master = await UserModel.findOne({_id: accessToken.user});


            if (!master || master.role != global.USER_ROLE_MASTER) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'master invalid'
                });
            }

            var page = req.query.page;

            if (!page || page < 1) {
                page = 1;
            }

            var admins = await UserModel.find({role: global.USER_ROLE_ADMIN}).select({
                hash_password: 0,
                confirmToken: 0
            }).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);

            let count = await UserModel.count({role: global.USER_ROLE_ADMIN});

            return res.json({
                status: 1,
                data: {
                    items: admins,
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
module.exports = AdminController
