/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    name: String,
    minDay: Number,
    costByDay: Number,
    priority: Number,
    status: {type : Number, default:global.STATUS.ACTIVE},
    date: {type: Number, default: Date.now}
});


var PaymentModel = mongoose.model('Postriority', postSchema);
module.exports = PaymentModel;
module.exports.Model = postSchema;
