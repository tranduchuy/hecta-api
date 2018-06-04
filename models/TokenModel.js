/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenSchema = new Schema({

    user: String,
    token: String,
    date : Date

});

var TokenModel = mongoose.model('Token', tokenSchema);
module.exports = TokenModel;