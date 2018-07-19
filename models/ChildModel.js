/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var childSchema = new Schema({

    companyId: String,
    personalId: String,
    status: {type: Number, default: global.CHILD_STATUS_WAITING},
    date: {type: Number, default: Date.now}

});


var ChildModel = mongoose.model('child', childSchema);
module.exports = ChildModel;
module.exports.Model = childSchema;
