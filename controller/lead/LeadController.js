const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../models/LeadModel');
const LeadHistoryModel = require('../../models/LeadHistoryModel');
const LeadService = require('./LeadService');

const createLead = async (req, res, next) => {
  // TODO: createLead
  logger.info('LeadController::createLead::called');

  try {
    const {name, email, phone, referenceDomain, utmSource, utmCampaign, utmMedium, area, price} = req.body;

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
