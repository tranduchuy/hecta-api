const mongoose = require('mongoose');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const LeadPriceScheduleModel = require('../../../models/LeadPriceScheduleModel');

const generateStageGetListLead = (queryObj, paginationCond) => {
  const stages = [];
  const $match = {};

  if (queryObj.status) {
    $match.status = queryObj.status;
  }

  if (queryObj.userId) {
    $match.user = userId;
  }

  if (queryObj.campaignId) {
    $match.campaign = new mongoose.Types.ObjectId(queryObj.campaignId);
  }

  if (queryObj.phone) {
    $match.phone = queryObj.phone;
  }

  if (Object.keys($match).length !== 0) {
    stages.push({$match});
  }

  // map campaign
  stages.push({
    '$lookup': {
      'from': 'Campaign',
      'localField': 'campaign',
      'foreignField': '_id',
      'as': 'campaignInfo'
    }
  });

  // map history
  stages.push({
    "$lookup": {
      "from": "LeadHistory",
      "localField": "_id",
      "foreignField": "lead",
      "as": "histories"
    }
  });

  stages.push({
    $facet: {
      entries: [
        {$skip: (paginationCond.page - 1) * paginationCond.limit},
        {$limit: paginationCond.limit}
      ],
      meta: [
        {$group: {_id: null, totalItems: {$sum: 1}}},
      ],
    }
  });
  return stages;
};

const createNewLeadHistory = async ({name, email, referenceDomain, utmSource, utmCampaign, utmMedium, area, price, leadId, bedrooms, bathrooms, street, note, direction}) => {
  const newHistory = new LeadHistoryModel();
  newHistory.name = name;
  newHistory.email = email;
  newHistory.referenceDomain = referenceDomain;
  newHistory.utmSource = utmSource;
  newHistory.utmCampaign = utmCampaign;
  newHistory.utmMedium = utmMedium;
  newHistory.area = area;
  newHistory.price = price;
  newHistory.bedrooms = bedrooms;
  newHistory.bathrooms = bathrooms;
  newHistory.street = street;
  newHistory.note = note;
  newHistory.direction = direction;
  newHistory.lead = new mongoose.Types.ObjectId(leadId);
  await newHistory.save();

  return newHistory
};

/**
 *
 * @param {String} leadId
 * @param {CampaignModel} campaign
 */
const createScheduleDownLeadPrice = (leadId, campaign) => {
  const newSchedule = new LeadPriceScheduleModel();
  newSchedule.lead = new mongoose.Types.ObjectId(leadId);
  newSchedule.price = campaign.leadMaxPrice;
  newSchedule.minPrice = campaign.leadMinPrice;
  newSchedule.downPriceStep = campaign.downPriceStep;

  const now = moment();
  newSchedule.createdAt = now._d;
  newSchedule.updatedAt = now._d;
  newSchedule.downPriceAt = moment().add(campaign.downTime, 'minutes')._d;
  newSchedule.save();
};

module.exports = {
  generateStageGetListLead,
  createNewLeadHistory,
  createScheduleDownLeadPrice
};
