const config = require('config');
const schedule = require('node-schedule');
const timeConfig = config.get('down_price_worker');
const DOWN_LEAD_PRICE_WORKER_TIMER = timeConfig.interval_time_check; // minute
const TIME_WAIT_TO_DOWN_LEAD_PRICE = timeConfig.next_time_down; // minute


function defineModel() {
  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;
  const leadPriceScheduleSchema = new Schema({
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead'
    },
    isFinished: {
      type: Boolean,
      default: false
    },
    price: Number,
    downPriceStep: Number,
    minPrice: Number,
    downPriceAt: Date,
    createdAt: Date,
    updatedAt: Date
  });

  return mongoose.model('LeadPriceSchedule', leadPriceScheduleSchema, 'LeadPriceSchedule');
}

schedule.scheduleJob(`*/${DOWN_LEAD_PRICE_WORKER_TIMER} * * * *`, async () => {
  try {
    /*TODO: DEFINE MODEL*/
    const LeadPriceScheduleModel = defineModel();
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
