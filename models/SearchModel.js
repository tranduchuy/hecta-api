/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var searchSchema = new Schema({


    type : Number,
    formality : Number,
    url : { type : String , unique : true, required : true },
    city : String,
    district : Number,
    areaFrom : Number,
    areaTo : Number,
    priceFrom : Number,
    priceTo : Number,
    ward: Number,
    street : Number,
    bedroom : Number,
    direction : Number,
    project : String,
});



var SearchModel = mongoose.model('Search', searchSchema);
module.exports = SearchModel;
module.exports.Model = searchSchema;
