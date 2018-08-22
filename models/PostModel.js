/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    content_id: String,

    postType: Number,
    type: Number,
    formality: Number,

    admin: String,
    status: Number,
    paymentStatus: Number,
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

    tags: {type: Array, default: []}


});

var PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
module.exports.Model = postSchema;
