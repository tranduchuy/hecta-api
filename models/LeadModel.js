const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// TODO
const leadSchema = new Schema({
});

const LeadModel = mongoose.model('Leads', leadSchema, 'Leads');
module.exports = LeadModel;
