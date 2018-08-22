/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var urlParamSchema = new Schema({


    param: String, //{type: String, unique: false},
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
    text: String,

    metaTitle: String,
    metaDescription: String,
    metaType: String,
    metaUrl: String,
    metaImage: String,
    canonical: String,
    textEndPage: String,

    status: {type: Number, default: global.STATUS_ACTIVE},

    updatedBy: {type: Array, default: []}


//     let metaTitle = req.body.metaTitle;
// let metaDescription = req.body.metaDescription;
// let metaType = req.body.metaType;
// let metaUrl = req.body.metaUrl;
// let metaImage = req.body.metaImage;
// let canonical = req.body.canonical;
// let textEndPage = req.body.textEndPage;

});


var UrlParamModel = mongoose.model('UrlParam', urlParamSchema);
module.exports = UrlParamModel;
module.exports.Model = urlParamSchema;
