/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({

    username: String,
    email: String,
    hash_password: String,
    confirmToken: String,
    phone: String,
    name: String,
    birthday: Number,
    gender: Number,
    city: String,
    avatar: String,
    district: Number,
    ward: Number,
    type: Number,
    status: {type: Number, default: global.USER_STATUS_WAIT_COMFIRM},
    date: {type: Number, default: Date.now}

});


var UserModel = mongoose.model('user', userSchema);
module.exports = UserModel;
module.exports.Model = userSchema;
