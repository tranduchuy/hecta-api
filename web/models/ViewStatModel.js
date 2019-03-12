const mongoose = require('mongoose');

const viewStateSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  utmSource: String,
  utmCampaign: String,
  utmMedium: String,
  device: String,
  browser: String,
  referrer: String,
  version: String,
  platform: String,
  createdAt: Date
});

module.exports = mongoose.model('ViewStats', viewStateSchema, 'ViewStats');
