/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    postType: Number,
    type: Number,
    content_id : String,
    priority: Number,
    from: Number,
    to: Number,
    formality: Number,
    user : String,

    status : Number,
    payment : Number,
    url : String,
    date: {type: Number, default: Date.now}



});

var PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
module.exports.Model = postSchema;
