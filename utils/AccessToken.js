
var TokenModel = require('../models/TokenModel');
var randomstring = require("randomstring");
var AccessToken = {

    generate: function (user) {

        var token = randomstring.generate(100) + new Date().getTime();



        TokenModel({
            token : token,
            user : user,
            date : new Date()
        }).save();

        return token;





    }

}
module.exports = AccessToken
