/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var saleSchema = new Schema({

    title: String,
    formality : Number,
    type: Number,
    city: Number,
    district: Number,
    ward: Number,
    street: Number,
    project: String,
    area: Number,
    price: Number,
    unit: Number,
    address : String,
    description : String,
    front_size: Number,
    street_width : Number,
    direction : Number,
    balcony_direction : Number,
    floor_count : Number,
    bedroom_count : Number,
    toilet_count : Number,
    furniture : String,
    images : Array,

    contact_name : String,
    contact_address : String,
    contact_phone : String,
    contact_mobile : String,
    contact_email: String,

    date: {type: Number, default: Date.now}


});

// saleSchema.index(
//     {
//         "source_": "text",
//         "destination_": "text",
//         "title_": "text"
//     },
//     {
//         "weights": {
//             "title_": 1,
//             "destination_": 1,
//             "source_": 1
//         }
//     }
// );

var SaleModel = mongoose.model('Sale', saleSchema);
module.exports = SaleModel;
module.exports.Model = saleSchema;
