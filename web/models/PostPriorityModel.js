const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postPrioritySchema = new Schema({
  name: String,
  minDay: Number,
  costByDay: Number,
  priority: Number,
  status: { type: Number, default: global.STATUS.ACTIVE }
});

const PriorityModel = mongoose.model('PostPriority', postPrioritySchema, 'PostPriorities');
module.exports = PriorityModel;
module.exports.Model = postPrioritySchema;
