/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paymentSchema = new Schema({

    owner: String,
    // credit: {type: Number, default: 0},
    promo: {type: Number, default: 0},
    main: {type: Number, default: 0},
    date: {type: Number, default: Date.now}
});


var PaymentModel = mongoose.model('Account', paymentSchema);
module.exports = PaymentModel;
module.exports.Model = paymentSchema;
