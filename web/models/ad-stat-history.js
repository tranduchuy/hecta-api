const mongoose = require('mongoose');

const viewStateSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  type: {
    type: Number,
    default: 1 // VIEW | CLICK | IMPRESSION
  },
  utmSource: String,
  utmCampaign: String,
  utmMedium: String,
  browser: String,
  referrer: String,
  version: String,
  device: String,
  os: String,
  createdAt: Date
});

module.exports = mongoose.model('AdStatHistory', viewStateSchema, 'AdStatHistory');
