/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    content_id : String,

    postType: Number,
    type: Number,
    formality: Number,

    user : String,

    status : Number,
    paymentStatus : Number,
    price : Number,

    priority: Number,

    from: Number,
    to: Number,

    url : String,
    date: {type: Number, default: Date.now},
    refresh: {type: Number, default: Date.now}




});

var PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
module.exports.Model = postSchema;
