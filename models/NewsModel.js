/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var newsSchema = new Schema({

    title: String,
    content: String,
    cate: String,
    image: String,
    status : {type : Number, default:global.STATUS_POST_ACTIVE},

    date: {type: Number, default: Date.now}


});

var NewsModel = mongoose.model('News', newsSchema);
module.exports = NewsModel;
module.exports.Model = newsSchema;
