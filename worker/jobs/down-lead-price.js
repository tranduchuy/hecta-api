const findValidLeads = async () => {};

const shouldDownPriceOnLead = () => {};

const schedule = require('node-schedule');
var event = schedule.scheduleJob("*/1 * * * *", function () {
  console.log('This runs every 1 minutes', new Date());
});
