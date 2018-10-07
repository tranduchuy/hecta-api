/**
 * Created by duong_000 on 10/18/2016.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const imageSchema = new Schema({
    status: Number,
    date: {type: Number, default: Date.now}
});

const ImageModel = mongoose.model('Image', imageSchema, 'Images');
module.exports = ImageModel;
module.exports.Model = imageSchema;
