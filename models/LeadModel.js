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
  isDeleted: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  referenceDomain: String,
  utmSource: String,
  utmCampaign: String,
  utmMedium: String,
  phone: String,
  price: Number,
  histories: [{type: Schema.Types.ObjectId, ref: 'LeadHistory'}],
  note: String
});

const LeadModel = mongoose.model('Lead', leadSchema, 'Leads');
module.exports = LeadModel;
