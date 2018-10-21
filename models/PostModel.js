/**
 * Created by duong_000 on 10/18/2016.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = new Schema({
    contentId: Schema.Types.ObjectId,
    postType: Number,
    type: Number,
    formality: Number,
    admin: String,
    status: Number,
    paymentStatus: {type : Number, default : global.STATUS.PAYMENT_UNPAID},
    price: Number,
    priority: Number,
    from: Number,
    to: Number,
    params: String,
    url: String,
    date: {type: Number, default: Date.now},
    refresh: {type: Number, default: Date.now},
    metaTitle: String,
    metaDescription: String,
    metaType: String,
    metaUrl: String,
    metaImage: String,
    canonical: String,
    textEndPage: String,
    user: String,
    tags: {type: Array, default: []}
});

const PostModel = mongoose.model('Post', postSchema, 'Posts');
module.exports = PostModel;
module.exports.Model = postSchema;
