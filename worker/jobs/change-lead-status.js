const moment = require('moment');
const LeadModel = require('../../web/models/LeadModel');
const schedule = require('node-schedule');

const findValidLeads = async () => {
    try {
        let query = {};
        query.status = global.STATUS.LEAD_SOLD;
        let leads = await LeadModel.find(query);
        const searchDate = new Date();
        searchDate.setMinutes(searchDate.getMinutes() - 10);
        leads = leads.filter((lead)=> {
            return !moment(searchDate).isBefore(lead.boughtAt);
        });
        return leads;
    }catch (e) {
        console.log(e);
    }
};

const shouldDownPriceOnLead = async () => {
    try {
        let leads = await findValidLeads();
        if(leads.length > 0){
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
    console.log("Change status lead worker started...")
    return schedule.scheduleJob("*/5 * * * * *",  async () => {
        try {
            console.log('This runs every 30 seconds', new Date());
            const results = await shouldDownPriceOnLead();
            console.log("Number of changed status leads : " + results.length);
        }catch (e) {
            console.log(e);
        }
        });
}

module.exports = ChangeLeadStatusWorker;

