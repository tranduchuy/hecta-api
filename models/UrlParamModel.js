const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const urlParamSchema = new Schema({
    param: String, //{type: String, unique: false},
    customParam: {type: String, default: ''},
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
    status: {type: Number, default: global.STATUS.ACTIVE},
    updatedBy: {type: Array, default: []}
});

const UrlParamModel = mongoose.model('UrlParam', urlParamSchema, 'UrlParams');
module.exports = UrlParamModel;
module.exports.Model = urlParamSchema;
