var EmailValidator = require("email-validator");
var UserModel = require('../models/UserModel');
var _ = require('lodash');
var bcrypt = require('bcrypt');
var AccessToken = require('../utils/AccessToken');
var TokenModel = require('../models/TokenModel');

var UserController = {
    highlight: async function (req, res, next) {

        try {


            let users = await UserModel.find({phone: {$ne: null}, avatar: {$ne: null}}).sort({date: -1}).limit(10);

            let results = await Promise.all(users.map(async user => {


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

    },
    check: async function (req, res, next) {
        var username = req.body.username;

        if (!username || username.length < 6) {
            return res.json({
                status: 1,
                data: false,
                message: 'user invalid'
            });

        }

        try {

            let user = await UserModel.findOne({username: username});


            if (user) {
                return res.json({
                    status: 1,
                    data: false,
                    message: 'user duplicated'
                });
            }
            else {
                return res.json({
                    status: 1,
                    data: true,
                    message: 'user available'
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

    },

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
                status: 1,
                data: false,
                message: 'username invalid'
            });

        }

        var user = await UserModel.findOne({username: username});

        if (!user) {
            return res.json({
                status: 0,
                data: {},
                message: 'username : "' + username + '" is not exist'
            });

        }

        if (await bcrypt.compareSync(password, user.hash_password)) {

            var result = {};

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

    }
    ,

    register: async function (req, res, next) {


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
    }
}
module.exports = UserController
