/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var urlParamSchema = new Schema({


    param: {type: String, unique: true},
    postType: Number,

    formality: Number,
    type: Number,
    city: String,
    district: Number,
    ward: Number,
    street: Number,
    project: String,
    balconyDirection: Number,
    bedroomCount: Number,
    areaMax: Number,
    areaMin: Number,
    area: Number,
    priceMax: Number,
    priceMin: Number,
    price: Number,

    extra: Object,
    text : String

});


var UrlParamModel = mongoose.model('UrlParam', urlParamSchema);
module.exports = UrlParamModel;
module.exports.Model = urlParamSchema;
