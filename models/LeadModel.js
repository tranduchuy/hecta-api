const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const leadSchema = new Schema({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  user: {
    type: Number,
    default: null
  },
  status: {
    type: Number,
    default: global.STATUS.LEAD_NEW
  },
  deleteFlag: {
    type: Number,
    default: 0
  },
  phone: String,
  price: Number,
  histories: [{type: Schema.Types.ObjectId, ref: 'LeadHistory'}],
  note: String,
  referenceDomain: String,
  utmSource: String,
  utmCampaign: String,
  utmMedium: String,
  createdAt: Date,
  updatedAt: Date
});

const LeadModel = mongoose.model('Lead', leadSchema, 'Leads');
module.exports = LeadModel;
