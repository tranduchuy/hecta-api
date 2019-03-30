const RuleAlertLeadModel = require('../models/RuleAlertLeadModel');
const Socket = require('../utils/Socket');
const NotifyContent = require('../config/notify-content');
const CampaignModel = require('../models/CampaignModel');
const ProjectModel = require('../models/ProjectModel');

const notifyNewLeadByCampaign = async (campaignId) => {
  try {
    const campaign = await CampaignModel.findOne({_id: campaignId});
    if (!campaign) {
      return;
    }

    let rules;

    if (campaign.project) {
      const project = await ProjectModel.findOne({_id: campaign.project});
      if (!project) {
        return;
      }
      let queryList = [];
      let queryLocation = {};

      queryLocation.formality = campaign.formality;
      queryLocation.type = campaign.type;
      queryLocation.city = project.city;
      queryLocation.district = project.district;
      queryList.push(queryLocation);
      let queryProject = {};
      queryProject.formality = campaign.formality;
      queryProject.type = campaign.type;
      queryProject.project = project.id;
      queryList.push(queryProject);
      rules = await RuleAlertLeadModel.find({$or: queryList});
    } else {
      let query = {};
      query.formality = campaign.formality;
      query.type = campaign.type;
      query.city = campaign.city;
      query.district = campaign.district;
      rules = await RuleAlertLeadModel.find(query);
    }

    const userIds = rules.map(rule => {
      return rule.userId;
    });

    userIds.map(userId => {
      Socket.pushToUser(userId, NotifyContent.NewLead);
    });
  } catch (e) {
    console.log(e);
  }
};

const notifyNewLeadOfPrivateCampaign = async (userId) => {
  // TODO
};

module.exports = {
  notifyNewLeadByCampaign,
  notifyNewLeadOfPrivateCampaign
};