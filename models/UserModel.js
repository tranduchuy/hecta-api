/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

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
    role: Number,
    status: {type: Number, default: global.USER_STATUS_WAIT_COMFIRM},
    date: {type: Number, default: Date.now}

});


var UserModel = mongoose.model('user', userSchema);
module.exports = UserModel;
module.exports.Model = userSchema;

async function asyncCall() {

    var master = await UserModel.findOne({role: global.USER_ROLE_MASTER});

    if (master) {
        console.log('master is exist ' + master.email);
        return;
    }

    master = new UserModel({
        username: 'master',
        email: 'master@hecta.vn',
        name: 'master',
        hash_password: bcrypt.hashSync('master@hecta.vn', 10),
        status: global.STATUS_ACTIVE,
        role: global.USER_ROLE_MASTER
    });

    await master.save();
    console.log('master is created :  ' + master.email);


}

asyncCall();

