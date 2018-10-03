const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const systemSchema = new Schema({
    crawler: Object
});

const SystemSchema = mongoose.model('Systems', systemSchema);
module.exports = SystemSchema;
module.exports.Model = systemSchema;
