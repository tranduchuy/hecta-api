const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notifySchema = new Schema({
    fromUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    type: Number,
    params: Object,
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

const NotidyModel = mongoose.model('Notifies', notifySchema);
module.exports = NotidyModel;
module.exports.Model = notifySchema;