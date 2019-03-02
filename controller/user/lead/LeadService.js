const CampaignModel = require('../../../models/CampaignModel');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const mongoose = require('mongoose');

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

const createNewLeadHistory = async ({name, email, referenceDomain, utmSource, utmCampaign, utmMedium, area, price, leadId, bedrooms, street, note, direction}) => {
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

module.exports = {
  isValidDomainToCampaign,
  createNewLeadHistory,
  generateStageGetLeads
};
