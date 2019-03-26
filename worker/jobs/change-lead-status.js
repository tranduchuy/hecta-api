const moment = require('moment');
const LeadModel = require('../../web/models/LeadModel');
const schedule = require('node-schedule');

const findValidLeads = async () => {
    try {
        console.log('findValidLeads work')
        let query = {};
        query.status = global.STATUS.LEAD_SOLD;
        let leads = await LeadModel.findOne({});
        console.log(leads);
        const searchDate = new Date();
        searchDate.setMinutes(searchDate.getMinutes() - 10);
        leads = leads.filter((lead)=> {
            return !moment(searchDate).isAfter(lead.boughtAt);
        });
        console.log(leads);
        return leads;
    }catch (e) {
        console.log(e);
    }
};

const shouldDownPriceOnLead = async () => {
    try {
        console.log("should down price work");
        let leads = await findValidLeads();
        console.log(leads);
        if(leads > 0){
            const results = await Promise.all(leads.map( async lead =>{
                lead.status = global.STATUS.LEAD_FINISHED;
                await lead.save();
            }));
            return results;
        }
        return [];
    }catch (e) {
        console.log(e);
    }
};



const ChangeLeadStatusWorker =  ()=>{
    console.log('worker work');
    return schedule.scheduleJob("*/5 * * * * *",  async () => {
        try {
            console.log('This runs every 30 seconds', new Date());
            const results = await shouldDownPriceOnLead();
            console.log(results);
            console.log("done");
        }catch (e) {
            console.log(e);
        }
        });
}

module.exports = ChangeLeadStatusWorker;

