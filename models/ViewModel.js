const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const viewSchema = new Schema({
    objectId: {
        type: mongoose.Types.ObjectId
    },
    type: String, // target of objectId: postSale, postBuy, news, project 
    date: {
        type: Date,
        default: moment().startOf('day')
    },
    count: {
        type: Number,
        default: 1
    }
});

var ViewModel = mongoose.model('View', viewSchema);
module.exports = ViewModel;
module.exports.Model = viewSchema;