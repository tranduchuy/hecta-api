const mongoose = require('mongoose');
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

