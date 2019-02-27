const CampaignModel = require('../../models/CampaignModel');
const LeadHistoryModel = require('../../models/LeadHistoryModel');
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

module.exports = {
  isValidDomainToCampaign,
  createNewLeadHistory
};
