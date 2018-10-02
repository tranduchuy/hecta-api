/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var buySchema = new Schema({

    title: String,
    description: String,
    keywordList: Array,

    formality: Number,
    type: Number,
    city: String,
    district: Number,
    ward: Number,
    street: Number,
    project: String,
    areaMin: Number,
    areaMax: Number,
    priceMin: Number,
    priceMax: Number,
    unit: Number,

    address: String,

    images: Array,

    contactName: String,
    contactAddress: String,
    contactPhone: String,
    contactMobile: String,
    contactEmail: String,
    receiveMail: Boolean,

    admin: {type: Array, default: []},


    status: {type: Number, default: global.STATUS.PENDING_OR_WAIT_COMFIRM},
    date: {type: Number, default: Date.now},
    createdByType: {type: Number, default: global.CREATED_BY.HAND}
});


var BuyModel = mongoose.model('Buy', buySchema);
module.exports = BuyModel;
module.exports.Model = buySchema;
