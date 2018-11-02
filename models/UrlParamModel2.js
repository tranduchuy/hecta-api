/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var urlParamSchema4 = new Schema({


    // param: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    param: String, //{type: String, unique: false},
    customParam: {type: String, default: ''},
    postType: Number,

    formality: Number,
    type: Number,

    city: String,
    district: Number,
    ward: Number,
    street: Number,
    balconyDirection: Number,
    bedroomCount: Number,
    areaMax: Number,
    areaMin: Number,
    area: Number,
    priceMax: Number,
    priceMin: Number,
    price: Number,

    project: String,

    extra: Object,
    text: String,

    metaTitle: String,
    metaDescription: String,
    metaType: String,
    metaUrl: String,
    metaImage: String,
    canonical: String,
    textEndPage: String,

    status: {type: Number, default: global.STATUS.ACTIVE},

    updatedBy: {type: Array, default: []}


//     let metaTitle = req.body.metaTitle;
// let metaDescription = req.body.metaDescription;
// let metaType = req.body.metaType;
// let metaUrl = req.body.metaUrl;
// let metaImage = req.body.metaImage;
// let canonical = req.body.canonical;
// let textEndPage = req.bdy.textEndPage;

});


var UrlParamModel4 = mongoose.model('UrlParam4', urlParamSchema4);
module.exports = UrlParamModel4;
module.exports.Model = urlParamSchema4;
