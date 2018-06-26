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
    price: Number



    // searchBoxValue = {
    //     'address': "124 lý thường kiệt",
    //     'formality': {value: 38, text: 'Nhà đất bán'},
    //     'type': {value: 324, 'text': 'Bán căn hộ chung cư'},
    //     'city': {'value': 'SG', 'text': 'Hồ Chí Minh'},
    //     'district': {'value': 11850, 'text': 'Bình Hưng'},
    //     'ward': {value: 11849, text: "Bình Chánh"},
    //     'street': {text: "11", value: 1998},
    //     'project': {text: "Angia Star", value: 2041},
    //     'area': {max: {value: 80}, min: {value: 50}, text: "50 - 80 m2"},
    //     'price': {max: {value: 800000000}, min: {value: 500000000}, text: "500 - 800 triệu"},
    //     'direction': {value: "3", text: "Nam"},
    //     'bedroomCount': {text: "4+", value: "4"}
    // };


});


var UrlParamModel = mongoose.model('UrlParam', urlParamSchema);
module.exports = UrlParamModel;
module.exports.Model = urlParamSchema;
