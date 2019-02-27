const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../models/LeadModel');
const CampaignModel = require('../../models/CampaignModel');
const LeadHistoryModel = require('../../models/LeadHistoryModel');
const LeadService = require('./LeadService');
const Validator = require('../../utils/Validator');
const HTTP_CODE = require('../../config/http-code');

const createLead = async (req, res, next) => {
  // TODO: createLead
  logger.info('LeadController::createLead::called');

  try {
    let {name, email, phone, referenceDomain, utmSource, utmCampaign, utmMedium, area, price, campaignId,
    bedrooms, street, note, direction} = req.body;
    if (!phone) {
      return next(new Error('Số điện thoại là bắt buộc'));
    }

    if (!Validator.isValidPhoneNumber(phone) || isNaN(phone)) {
      return next(new Error('Số điện thoại không đúng, 10-13 kí tự'));
    }

    if (!referenceDomain) {
      return next(new Error('Không xác định được domain'));
    }

    if (!campaignId) {
      return next(new Error('Không xác định được chiến dịch'));
    }

    let campaign = await CampaignModel.findOne({_id: campaignId});
    if (!campaign) {
      return next(new Error('Không xác định được chiến dịch'));
    }

    const isValidDomain = await LeadService.isValidDomainToCampaign(campaignId, referenceDomain);
    if (!isValidDomain) {
      return next(new Error('Domain không hợp lệ'));
    }

    // TODO: cần thêm 1 bước chuyển số điện thoại về dạng chuẩn: không có 84, bắt đầu bằng 0

    let lead = await LeadModel.findOne({
      phone,
      campaign: campaignId
    });

    if (!lead) {
      lead = new LeadModel();
      lead.phone = phone;
      lead.campaign = campaignId;
      lead.price = null;
      lead.createdAt = new Date();
      lead.updatedAt = new Date();
    }

    const newLeadHistory = {
      name: name || '',
      email: email || '',
      referenceDomain: referenceDomain,
      utmSource: utmSource || '',
      utmCampaign: utmCampaign || '',
      utmMedium: utmMedium || '',
      area: area || null,
      price: price || null,
      bedrooms: bedrooms || null,
      street: street || '',
      note: note || '',
      direction: direction || null,
      leadId: lead._id
    };

    const newHistory = await LeadService.createNewLeadHistory(newLeadHistory);
    lead.histories.push(newHistory._id);
    await lead.save();
    logger.info('LeadController::createLead::success');

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {}
    });
  } catch (e) {
    logger.error('LeadController::createLead::error', e);
    return next(e);
  }
};

const getListLead = async (req, res, next) => {
  // TODO: getListLead
};

module.exports = {
  createLead,
  getListLead
};
