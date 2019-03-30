const moment = require('moment');
const LeadModel = require('../../web/models/LeadModel');
const schedule = require('node-schedule');
const log4js = require('log4js');
const logger = log4js.getLogger('Workers');
const config = require('config');
const ChangeLeadStatusWorkerConfig = config.get('changeLeadStatus');

const findValidLeads = async () => {
  try {
    let query = {
      query: global.STATUS.LEAD_SOLD
    };
    let leads = await LeadModel.find(query);

    const searchDate = new Date();
    searchDate.setMinutes(searchDate.getMinutes() - 10);

    return leads.filter((lead) => {
      if (!lead.boughtAt) {
        logger.warn('WORKER::ChangeLeadStatus::findValidLeads::Not defined boughAt of lead id', lead._id);
        return false;
      }

      return !moment(searchDate).isBefore(lead.boughtAt);
    });
  } catch (e) {
    logger.error('WORKER::ChangeLeadStatus::findValidLeads::Error', e);
    return [];
  }
};

const shouldFinishedBuyingOnLeads = async () => {
  try {
    let leads = await findValidLeads();

    if (leads.length > 0) {
      return await Promise.all(leads.map(async lead => {
        logger.info('WORKER::ChangeLeadStatus::shouldFinishedBuyingOnLeads::Change status FINISHED of lead id', lead._id);
        lead.status = global.STATUS.LEAD_FINISHED;
        await lead.save();
      }));
    }

    return [];
  } catch (e) {
    logger.error('WORKER::ChangeLeadStatus::shouldFinishedBuyingOnLeads::Error', e);
    return [];
  }
};


module.exports = () => {
  logger.info('WORKER::ChangeLeadStatus::Init: Change status of sold lead');

  return schedule.scheduleJob(`*/${ChangeLeadStatusWorkerConfig.intervalTimeCheck} * * * * *`, async () => {
    try {
      logger.info('WORKER::ChangeLeadStatus::Start at', new Date());
      const updatedLeads = await shouldFinishedBuyingOnLeads();
      logger.info(`WORKER::ChangeLeadStatus::Finish at ${new Date()}, update on number of leads `, updatedLeads.length);
    } catch (e) {
      logger.error('WORKER::ChangeLeadStatus::Error', e);
    }
  });
};

