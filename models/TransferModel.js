/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transferSchema = new Schema({

    childId: String,
    mount: Number,
    note : String,
    date: {type: Number, default: Date.now}

});


var TransferModel = mongoose.model('transfer', transferSchema);
module.exports = TransferModel;
module.exports.Model = transferSchema;
