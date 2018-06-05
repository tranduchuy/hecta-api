/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    type: String,
    content_id : String,
    priority: Number,
    from: Number,
    to: Number,
    user : String,

    status : Number,
    payment : Number,

    date: {type: Number, default: Date.now}



});

var PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
module.exports.Model = postSchema;
