/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var imageSchema = new Schema({

    status: Number,
    date: {type: Number, default: Date.now}


});


var ImageModel = mongoose.model('Image', imageSchema);
module.exports = ImageModel;
module.exports.Model = imageSchema;
