/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var buySchema = new Schema({

    title: String,
    content : String,
    formality : Number,
    type: Number,
    city: String,
    district: Number,
    ward: Number,
    street: Number,
    project: String,
    area: Number,
    price: Number,
    unit: Number,
    address : String,


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

var BuyModel = mongoose.model('Buy', buySchema);
module.exports = BuyModel;
module.exports.Model = buySchema;
