/**
 * Created by duong_000 on 10/18/2016.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const userSchema = new Schema({
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
    role: {type: Number, default: global.USER_ROLE_ENDUSER},
    status: {type: Number, default: global.STATUS.PENDING_OR_WAIT_COMFIRM},
    date: {type: Number, default: Date.now},
    resetPasswordToken: String,
    expirationDate: {type: Number, default: Date.now()},
});

const UserModel = mongoose.model('User', userSchema, 'Users');
module.exports = UserModel;
module.exports.Model = userSchema;

async function asyncCall() {
    let master = await UserModel.findOne({role: global.USER_ROLE_MASTER});
    if (master) {
        return;
    }

    master = new UserModel({
        username: 'master',
        email: 'master@hecta.vn',
        name: 'master',
        hash_password: bcrypt.hashSync('master@hecta.vn', 10),
        status: global.STATUS.ACTIVE,
        role: global.USER_ROLE_MASTER
    });

    await master.save();
    console.log('master is created :  ' + master.email);
}

const ChildModel = require('./ChildModel');
const AccountModel = require('./AccountModel');

module.exports.purchase = async function (userId, amount) {
    const user = UserModel.findOne({_id: userId});

    if (!user || user.expirationDate < Date.now()) {
        return false;
    }

    const child = await ChildModel.findOne({personalId: userId});
    const account = await AccountModel.findOne({owner: userId});

    const before = {
        credit: child ? child.credit : 0,
        main: account ? account.main : 0,
        promo: account ? account.promo : 0
    };

    if (child) {
        if (amount <= child.credit) {
            child.credit -= amount;
            amount = 0;
        }
        else {
            amount -= child.credit;
            child.creditUsed += child.credit;
            child.credit = 0;

        }
    }

    if (amount <= account.promo) {
        account.promo -= amount;
        amount = 0;
    } else {
        amount -= account.promo;
        account.promo = 0;
    }

    if (amount <= account.main) {
        account.main -= amount;
        amount = 0;
    } else {
        amount -= account.main;
        account.main = 0;
    }


    if (amount === 0) {
        if (account) {
            await account.save();
        }

        if (child) {
            await child.save();
        }

        const after = {
            credit: child ? child.credit : 0,
            main: account ? account.main : 0,
            promo: account ? account.promo : 0
        };

        return {
            after: after,
            before: before
        };

    }

    return false;
};

asyncCall();

