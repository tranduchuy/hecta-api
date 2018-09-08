/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;


var transactionHistorySchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    adminId: {type: Schema.Types.ObjectId, ref: 'User'},
    amount: Number,
    note: String,
    info: String,// receiver or sender or sale
    type: Number,
    before: {
        type: Object, default: {
            credit: 0,
            main: 0,
            promo: 0
        }

    },
    after: {
        type: Object, default: {
            credit: 0,
            main: 0,
            promo: 0
        }

    },
    date: {type: Number, default: Date.now}
});


var TransactionHistory = mongoose.model('TransactionHistory', transactionHistorySchema);
module.exports = TransactionHistory;
module.exports.Model = transactionHistorySchema;
module.exports.addTransaction = async function (user, admin, amount, note, info, type, before, after) {


    let transaction = new TransactionHistory({
        userId: new ObjectId(user),
        adminId: new ObjectId(admin),
        amount: amount,
        note: note,
        info: info,
        type: type,
        before: before,
        after: after
    });
    await transaction.save();


};
