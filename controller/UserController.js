var EmailValidator = require("email-validator");
var UserModel = require('../models/UserModel');
var _ = require('lodash');
var bcrypt = require('bcrypt');
var AccessToken = require('../utils/AccessToken');

var UserController = {

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

        if(bcrypt.compareSync(password, user.hash_password)) {

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


    }

}
module.exports = UserController
