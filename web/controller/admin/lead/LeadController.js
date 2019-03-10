const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../../models/LeadModel');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const LeadService = require('./LeadService');
const CampaignModel = require('../../../models/CampaignModel');
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
      return next(new Error('Lead not found'));
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

// Note: just create new history, because "phone" is primary key, so we can't update this field => just create new history
const updateInfo = async (req, res, next) => {
  logger.info('AdminLeadController::updateInfo::called');
  try {
    const errors = AJV(VALIDATE_SCHEMAS.UPDATE_INFO, req.body);
    if (errors.length > 0) {
      return next(new Error(errors.join('\n')));
    }

    const lead = await LeadModel.findOne({_id: req.params.id});
    if (!lead) {
      return next(new Error('Lead not found'));
    }

    const {name, email, bedrooms, bathrooms, area, street, direction, note, price} = req.body;

    const newLeadHistory = {
      name: name || '',
      email: email || '',
      referenceDomain: '',
      utmSource: '',
      utmCampaign: '',
      utmMedium: '',
      area: area || null,
      price: price || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      street: street || '',
      note: note || '',
      direction: direction || null,
      leadId: lead._id
    };

    const newHistory = await LeadService.createNewLeadHistory(newLeadHistory);
    lead.histories.push(newHistory._id);
    await lead.save();
    logger.info('LeadController::createLead::success');

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {}
    });
  } catch (e) {
    logger.error('AdminLeadController::updateInfo:error', e);
    return next(e);
  }
};

const create = async (req, res, next) => {
  logger.info('AdminLeadController::create::called');
  try {
    const errors = AJV(VALIDATE_SCHEMAS.CREATE, req.body);
    if (errors.length > 0) {
      return next(new Error(errors.join('\n')));
    }

    const {phone, name, email, campaignId, bedrooms, bathrooms, area, street, direction, note, price} = req.body;

    // TODO: cần thêm 1 bước chuyển số điện thoại về dạng chuẩn: không có 84, bắt đầu bằng 0
    let isCreatingNewLead = false;
    let lead = await LeadModel.findOne({
      phone,
      campaign: campaignId,
      status: {
        $ne: global.STATUS.LEAD_FINISHED // chỉ khi nào lead đó hoàn toàn thuộc về 1 user (qua thời gian có thể trả
                                         // lead) thì mới tạo lead mới
      }
    });

    const campaign = await CampaignModel.findOne({_id: campaignId});
    if (!campaign) {
      return next(new Error('Campaign not found'));
    }

    if (!lead) {
      lead = new LeadModel();
      lead.phone = phone;
      lead.campaign = campaignId;
      lead.price = null;
      lead.createdAt = new Date();
      lead.updatedAt = new Date();
      isCreatingNewLead = true;

      if (campaign.isPrivate) {
        lead.user = campaign.user;
      }
    }

    const newLeadHistory = {
      name: name || '',
      email: email || '',
      referenceDomain: '',
      utmSource: '',
      utmCampaign: '',
      utmMedium: '',
      area: area || null,
      price: price || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      street: street || '',
      note: note || '',
      direction: direction || null,
      leadId: lead._id
    };

    const newHistory = await LeadService.createNewLeadHistory(newLeadHistory);
    lead.histories.push(newHistory._id);
    await lead.save();
    logger.info('LeadController::createLead::success');

    // create schedule down lead price
    if (!campaign.isPrivate && isCreatingNewLead === true) {
      LeadService.createScheduleDownLeadPrice(lead._id, campaign);
    }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {}
    });
  } catch (e) {
    logger.error('AdminLeadController::create::error', e);
    return next(e);
  }
};

const getDetail = async (req, res, next) => {
  logger.info('LeadController::getDetail::called');
  try {
    const lead = await LeadModel.findOne({_id: req.params.id}).lean();
    if (!lead) {
      return next(new Error('Lead not found'));
    }

    lead.histories = await LeadHistoryModel.find({lead: lead._id})
      .sort('-createdAt')
      .lean();

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {
        lead
      }
    });
  } catch (e) {
    logger.error('LeadController::getDetail::error', e);
    return next(e);
  }
};

module.exports = {
  getList,
  getDetail,
  updateStatus,
  updateInfo,
  create
};
