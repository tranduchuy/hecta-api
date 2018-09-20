var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notifySchema = new Schema({
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: Number,
    default: global.STATUS.NOTIFY_NONE
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  createdTime: Date,
  updatedTime: Date
});

var NotidyModel = mongoose.model('Notifies', notifySchema);
module.exports = NotidyModel;
module.exports.Model = notifySchema;