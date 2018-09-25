/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tagSchema = new Schema({

    slug: String,
    keyword: String,
    refresh: Number,
    status: {type: Number, default: global.STATUS.ACTIVE},
    date: {type: Number, default: Date.now},

    updatedBy: {type: Array, default: []},

    metaTitle: String,
    metaDescription: String,
    metaType: String,
    metaUrl: String,
    metaImage: String,
    canonical: String,
    textEndPage: String
});


var TagModel = mongoose.model('Tag', tagSchema);
module.exports = TagModel;
module.exports.Model = tagSchema;