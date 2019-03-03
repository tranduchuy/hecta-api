const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../../models/LeadModel');

const getList = async (req, res, next) => {
  logger.info('AdminLeadController::getList::called');

  try {

  } catch (e) {
    logger.error('AdminLeadController::getList::error');
    return next(e);
  }
};

module.exports = {
  getList
};
