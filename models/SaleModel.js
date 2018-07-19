/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var saleSchema = new Schema({

    title: String,

    formality: Number,
    type: Number,
    city: String,
    district: Number,
    ward: Number,
    street: Number,
    project: String,
    area: Number,
    price: Number,
    unit: Number,
    address: String,

    keywordList: Array,

    description: String,

    streetWidth: Number,
    frontSize: Number,
    direction: Number,
    balconyDirection: Number,
    floorCount: Number,
    bedroomCount: Number,
    toiletCount: Number,
    furniture: String,

    images: Array,

    contactName: String,
    contactAddress: String,
    contactPhone: String,
    contactMobile: String,
    contactEmail: String,

    status : {type : Number, default:global.STATUS_POST_PENDING},
    date: {type: Number, default: Date.now},


});

var SaleModel = mongoose.model('Sale', saleSchema);
module.exports = SaleModel;
module.exports.Model = saleSchema;
