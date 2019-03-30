const config = require('config');
const schedule = require('node-schedule');
const LeadPriceScheduleModel = require('../../web/models/LeadPriceScheduleModel');
const db = require('../database/db');

const timeConfig = config.get('down_price_worker');
const DOWN_LEAD_PRICE_WORKER_TIMER = timeConfig.interval_time_check; // minute
const TIME_WAIT_TO_DOWN_LEAD_PRICE = timeConfig.next_time_down; // minute

db(() => {
  console.log('Connect to mongodb successfully');

  schedule.scheduleJob(`*/${DOWN_LEAD_PRICE_WORKER_TIMER} * * * *`, async () => {
    try {
      console.log('This runs every 1 minutes', new Date());
      const leadPriceSchedules = await LeadPriceScheduleModel.find({isFinished: false});

      leadPriceSchedules.map(async ($) => {
        console.log(`BEFORE\nPrice${$.price}\nMinPrice:${$.minPrice}\nNow: ${Date.now()}\nNext ${$.downPriceAt.getTime()}`);

        if (Date.now() < $.downPriceAt.getTime()) return;

        console.log("$.downPriceStep", $.downPriceStep);

        $.price -= $.downPriceStep;
        $.downPriceAt = new Date(Date.now() + TIME_WAIT_TO_DOWN_LEAD_PRICE * 60000);
        if ($.price <= $.minPrice) {
          $.price = $.minPrice;
          $.isFinished = true;
        }

        await $.save();
        console.log(`AFTER\nPrice${$.price}\nMinPrice:${$.minPrice}\nNext ${$.downPriceAt.getTime()}\n`);
      });
    } catch (error) {
      console.error(error);
    }
  });
});
