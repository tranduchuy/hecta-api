const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../../models/LeadModel');
const LeadService = require('./LeadService');
const AJV = require('../../../services/AJV');
const VALIDATE_SCHEMAS = require('./validator-schema');
const HTTP_CODE = require('../../../config/http-code');
const CDP_APIS = require('../../../config/cdp-url-api.constant');
const {extractPaginationCondition} = require('../../../utils/RequestUtil');

const getList = async (req, res, next) => {
  logger.info('AdminLeadController::getList::called');

  try {
    const errors = AJV(VALIDATE_SCHEMAS.LIST, req.query);
    if (errors.length > 0) {
      return next(new Error(errors.join('\n')));
    }

    const {status, campaignId, userId, phone} = req.query;
    const queryObj = {};
    if (status) {
      queryObj.status = parseInt(status, 0);
    }

    if (userId) {
      queryObj.userId = parseInt(userId, 0);
    }

    if (phone) {
      queryObj.phone = phone;
    }

    if (campaignId) {
      queryObj.campaignId = campaignId;
    }

    const paginationCond = extractPaginationCondition(req);
    const stages = LeadService.generateStageGetListLead(queryObj, paginationCond);
    logger.info('AdminLeadController::getList stage', JSON.stringify(stages));
    const result = await LeadModel.aggregate(stages);
    const totalItems = result[0].meta.length > 0 ? result[0].meta[0].totalItems : 0;
    const entries = result[0].entries.map(item => {
      if (item.campaignInfo.length > 0) {
        item.campaign = {
          _id: item.campaignInfo[0]._id,
          name: item.campaignInfo[0].name
        };
      } else {
        item.campaign = null;
      }

      delete item.campaignInfo;

      return item;
    });

    const userIds = entries.filter(item => item.user).map(item => item.user);
    if (userIds.length > 0) {
      const urlGetUserInfo = `${CDP_APIS.USER.LIST_USER_INFO}?ids=${userIds.join(',')}`;
      return get(urlGetUserInfo, req.user.token)
        .then((response) => {
          const usersObj = {};
          response.data.entries.forEach(user => {
            usersObj[user.id] = user;
          });

          const entriesWithUsers = entries.map(item => {
            if (item.user && usersObj[item.user]) {
              item.user = usersObj[item.user];
            } else {
              item.user = null;
            }

            return item;
          });

          return res.json({
            status: HTTP_CODE.SUCCESS,
            message: 'Success',
            data: {
              meta: {totalItems},
              entries: entriesWithUsers
            }
          });
        })
        .catch((e) => {
          logger.error('AdminCampaignController::list::error', e);
          return next(e);
        });
    }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {
        meta: {totalItems},
        entries: entries
      }
    });
  } catch (e) {
    logger.error('AdminLeadController::getList::error');
    return next(e);
  }
};

const updateStatus = async (req, res, next) => {
  logger.info('AdminLeadController::updateStatus::called');
  try {
    const leadId = req.params.id;
    const errors = AJV(VALIDATE_SCHEMAS.UPDATE_STATUS, req.body);
    if (errors.length > 0) {
      return next(new Error(errors.join('\n')));
    }

    const lead = await LeadModel.findOne({_id: leadId});
    if (!lead) {
      return res.json({
        status: HTTP_CODE.ERROR,
        message: 'Lead not found',
        data: {}
      });
    }

    lead.status = status;
    await lead.save();

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {}
    });
  } catch (e) {
    logger.error('AdminLeadController::updateStatus::error');
    return next(e);
  }
};

const updateInfo = async (req, res, next) => {
  logger.info('AdminLeadController::updateInfo::called');
  try {
    // TODO: api update info
  } catch (e) {
    logger.error('AdminLeadController::updateInfo:error', e);
    return next(e);
  }
};

module.exports = {
  getList,
  updateStatus,
  updateInfo
};
