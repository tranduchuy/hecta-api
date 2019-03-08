const CampaignModel = require('../../../models/CampaignModel');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const LeadPriceScheduleModel = require('../../../models/LeadPriceScheduleModel');
const mongoose = require('mongoose');
const moment = require('moment');

const isValidDomainToCampaign = async (campaignId, domain) => {
  try {
    const campaign = await CampaignModel.findOne({_id: campaignId});
    if (!campaign) {
      return false;
    }

    // TODO: should improve this logic
    const validDomains = campaign.domains;

    return validDomains.indexOf(domain) !== -1;
  } catch (e) {
    logger.error('LeadService::isValidDomainToCampaign::error', e);
    return false;
  }
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
 * @param queryObj
 * @param paginationCond
 * @return array
 */
const generateStageGetLeads = (queryObj, paginationCond) => {
  const stages = [];

  const $match = {
    status: queryObj.status
  };

  if (queryObj.user) {
    $match['user'] = queryObj.user;
  }

  if (queryObj.deleteFlag) {
    $match['deleteFlag'] = deleteFlag;
  }

  stages.push({$match});

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
  // stages.push({"$lookup": {"from": "LeadHistory", "localField": "lead", "foreignField": "_id", "as": "histories"}});

  // pagination
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
  isValidDomainToCampaign,
  createNewLeadHistory,
  generateStageGetLeads,
  createScheduleDownLeadPrice
};
