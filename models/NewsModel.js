/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var newsSchema = new Schema({

    title: String,
    content: String,
    type: Number,
    image: String,
    description: String,
    status: {type: Number, default: global.STATUS.ACTIVE},


    // metaTitle: String,
    // metaDescription: String,
    // metaType: String,
    // metaUrl: String,
    // metaImage: String,
    // canonical: String,

    admin: {type: Array, default: []},
    date: {type: Number, default: Date.now},
    createdByType: {type: Number, default: global.CREATED_BY.HAND}
});

var NewsModel = mongoose.model('News', newsSchema);
module.exports = NewsModel;
module.exports.Model = newsSchema;
