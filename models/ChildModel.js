/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var childSchema = new Schema({

    companyId: String,
    personalId: String,
    status: {type: Number, default: global.STATUS.CHILD_WAITING},

    creditHistory: {type: Array, default: []},
    credit: {type: Number, default: 0},
    creditUsed: {type: Number, default: 0},

    date: {type: Number, default: Date.now}

});


var ChildModel = mongoose.model('child', childSchema);
module.exports = ChildModel;
module.exports.Model = childSchema;
