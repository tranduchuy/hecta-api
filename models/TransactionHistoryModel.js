/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paymentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    note: String,
    info: String,
    type: Number,
    current: Object,
    date: {type: Number, default: Date.now}
});


var PaymentModel = mongoose.model('Payment', paymentSchema);
module.exports = PaymentModel;
module.exports.Model = paymentSchema;
