/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var urlParamSchema = new Schema({


    param : String,
    postType : Number,

    formality : Number,
    type : Number,
    city : String,
    district : Number,
    ward : Number,
    street : Number,
    project : String,
    balconyDirection: Number,
    bedroomCount: Number,
    area: Number,
    price: Number







});



var UrlParamModel = mongoose.model('UrlParam', urlParamSchema);
module.exports = UrlParamModel;
module.exports.Model = urlParamSchema;
