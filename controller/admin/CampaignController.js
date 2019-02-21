const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const AJV = require('../../services/AJV');
const HTTP_CODE = require('../../config/http-code');
const CampaignModel = require('../../models/CampaignModel');
const CAMPAIGN_SCHEMAS = require('../validation-schemas/admin-campaign.schema');
const CampaignTypeConstant = require('../../constants/campaign-type');

const create = async (req, res, next) => {
  logger.info('AdminCampaignController::create::called');
  try {
    const errors = AJV(CAMPAIGN_SCHEMAS.CREATE, req.body);
    if (errors.length !== 0) {
      return next(new Error(errors.join('\n')));
    }

    const {name, leadMinPrice, leadMaxPrice, downTime, downPriceStep, campaignType,
      formality, type, city, district, projectId, domains, isPrivate, userId} = req.body;

    const newCampaign = new CampaignModel();
    newCampaign.name = name.trim();
    newCampaign.leadMinPrice = leadMinPrice;
    newCampaign.leadMaxPrice = leadMaxPrice;
    newCampaign.downTime = downTime;
    newCampaign.downPriceStep = downPriceStep;
    newCampaign.campaignType = campaignType;
    newCampaign.formality = formality;
    newCampaign.type = type;
    newCampaign.city = city;
    newCampaign.district = null;
    newCampaign.project = null;
    newCampaign.isPrivate = isPrivate;
    newCampaign.domains = domains;
    newCampaign.user = null;
    newCampaign.updatedAt = new Date();
    newCampaign.createdAt = new Date();
    newCampaign.admin = req.user.id;

    if (isPrivate === true) {
      if (userId === null || userId === undefined) {
        return next(new Error('UserId is required'));
      }

      newCampaign.user = userId;
    }

    if (campaignType === CampaignTypeConstant.PROJECT) {
      if (district === null || district === undefined) {
        return next(new Error('District is required'));
      }

      if (project === null || project === undefined) {
        return next(new Error('Project is required'));
      }

      newCampaign.district = district;
      newCampaign.project = projectId;
    }

    await newCampaign.save();
    logger.info('AdminCampaignController::create::success');

    return res.json({
      status:HTTP_CODE.SUCCESS,
      message: ['Success'],
      data: {}
    });
  } catch (e) {
    logger.error('AdminCampaignController::create::error', e);
    return next(e);
  }
};

module.exports = {
  create
};
