const config = require('config');
const log4js = require('log4js');
const logger = log4js.getLogger('Workers');
const schedule = require('node-schedule');
const timeConfig = config.get('down_price_worker');
const moment = require('moment');
const LeadPriceScheduleModel = require('../../web/models/LeadPriceScheduleModel');
const DOWN_LEAD_PRICE_WORKER_TIMER = timeConfig.interval_time_check; // minute
const TIME_WAIT_TO_DOWN_LEAD_PRICE = timeConfig.next_time_down; // minute

const findLeadScheduleNeedToBeUpdate = async () => {
  return await LeadPriceScheduleModel.find({isFinished: false});
};

const processDecreaseLeadPrice = async (leadPriceSchedules) => {
  await Promise.all(leadPriceSchedules.map(async (ls) => {
    if (moment().isBefore(moment(ls.downPriceAt))) {
      logger.info(`WORKER::DownLeadPrice::processDecreaseLeadPrice. Update lead id ${ls.lead}. Before price ${ls.price}, isFinished ${ls.isFinished}`);

      ls.price -= ls.downPriceStep;
      ls.downPriceAt = new Date(Date.now() + TIME_WAIT_TO_DOWN_LEAD_PRICE * 60000);

      if (ls.price <= ls.minPrice) {
        ls.price = ls.minPrice;
        ls.isFinished = true;
      }

      await ls.save();
      logger.info(`WORKER::DownLeadPrice::processDecreaseLeadPrice. Finish updating lead id ${ls.lead}. After price ${ls.price}, isFinished ${ls.isFinished}`);
    }
  }));
};

module.exports = () => {
  logger.info('WORKER::DownLeadPrice::Init');

  schedule.scheduleJob(`*/${DOWN_LEAD_PRICE_WORKER_TIMER} * * * *`, async () => {
    logger.info('WORKER::DownLeadPrice::Start at', new Date());

    try {
      const leadPriceSchedules = await findLeadScheduleNeedToBeUpdate();
      await processDecreaseLeadPrice(leadPriceSchedules);
    } catch (e) {
      logger.error('WORKER::DownLeadPrice::error', e);
    }
  });
};
