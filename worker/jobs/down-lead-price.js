const schedule = require('node-schedule');
var db = require('../database/db');

const DOWN_LEAD_PRICE_WORKER_TIMER = "1"; // minute
const TIME_WAIT_TO_DOWN_LEAD_PRICE = "10"; // minute

db(() => {
  console.log('Connect to mongodb successfully');

  // FIXME: AT NOW, CAN'T IMPORT MODEL TO HERE, SO NEED TO UPDATE BELOW CODE
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
  mongoose.model('LeadPriceSchedule', leadPriceScheduleSchema, 'LeadPriceSchedule');
  const LeadPriceScheduleModel = mongoose.model('LeadPriceSchedule');

  // schedule.scheduleJob(`*/${DOWN_LEAD_PRICE_WORKER_TIMER} * * * * *`, async () => { // for test
  schedule.scheduleJob(`*/${DOWN_LEAD_PRICE_WORKER_TIMER} * * * *`, async () => {
    try {
      console.log('This runs every 1 minutes', new Date());

      const leadPriceSchedules = await LeadPriceScheduleModel.find({ isFinished: false });
      // const leadPriceSchedules = await LeadPriceScheduleModel.find({ lead: "5c9de536434366279c0aa496", isFinished: false }); //for test
      console.log(leadPriceSchedules.length);
      leadPriceSchedules.map(async ($) => {
        console.log(`BEFORE\nPrice${$.price}\nMinPrice:${$.minPrice}\nNow: ${Date.now()}\nNext ${$.downPriceAt.getTime()}`);
        if ($.price === $.minPrice || Date.now() < $.downPriceAt.getTime()) return;

        console.log("$.downPriceStep", $.downPriceStep);

        $.price -= $.downPriceStep;
        // $.downPriceAt = new Date(Date.now() + TIME_WAIT_TO_DOWN_LEAD_PRICE * 20000); // for test
        $.downPriceAt = new Date(Date.now() + TIME_WAIT_TO_DOWN_LEAD_PRICE * 60000);
        await $.save();

        console.log(`AFTER\nPrice${$.price}\nMinPrice:${$.minPrice}\nNext ${$.downPriceAt.getTime()}\n`);
      });
    } catch (error) {
      console.log(error);

    }
  });
});
