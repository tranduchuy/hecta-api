const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const LeadModel = require('../../../models/LeadModel');
const CampaignModel = require('../../../models/CampaignModel');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const LeadService = require('./LeadService');
const Validator = require('../../../utils/Validator');
const HTTP_CODE = require('../../../config/http-code');
const LEAD_VALIDATE_SCHEMA = require('./validator-schemas');
const AJV = require('../../../services/AJV');
const {extractPaginationCondition} = require('../../../utils/RequestUtil');

const createLead = async (req, res, next) => {
  // TODO: createLead
  logger.info('LeadController::createLead::called');

  try {
    let {
      name, email, phone, referenceDomain, utmSource, utmCampaign, utmMedium, area, price, campaignId,
      bedrooms, bathrooms, street, note, direction
    } = req.body;
    if (!name) {
      return next(new Error('Tên bắt buộc'));
    }

    if (!phone) {
      return next(new Error('Số điện thoại là bắt buộc'));
    }

    if (!Validator.isValidPhoneNumber(phone) || isNaN(phone)) {
      return next(new Error('Số điện thoại không đúng, 10-13 kí tự'));
    }

    if (!referenceDomain) {
      return next(new Error('Không xác định được domain'));
    }

    if (!campaignId) {
      return next(new Error('Không xác định được chiến dịch'));
    }

    let campaign = await CampaignModel.findOne({_id: campaignId});
    if (!campaign) {
      return next(new Error('Không xác định được chiến dịch'));
    }

    const isValidDomain = await LeadService.isValidDomainToCampaign(campaignId, referenceDomain);
    if (!isValidDomain) {
      return next(new Error('Domain không hợp lệ'));
    }

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
      referenceDomain: referenceDomain,
      utmSource: utmSource || '',
      utmCampaign: utmCampaign || '',
      utmMedium: utmMedium || '',
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
    logger.error('LeadController::createLead::error', e);
    return next(e);
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getListLead = async (req, res, next) => {
  logger.info('LeadController::getListLead::called');
  try {
    // TODO: cần confirm lại cách hiển thị lead cho user
    const queryObj = {
      deleteFlag: 0
    };
    const errors = AJV(LEAD_VALIDATE_SCHEMA.LIST, req.query);
    if (errors.length > 0) {
      return next(new Error(errors.join('\n')));
    }

    let {status} = req.query;
    if (!status) {
      queryObj.status = global.STATUS.LEAD_NEW;
    } else {
      status = parseInt(status, 0);
      queryObj.status = status;
      if (status !== global.STATUS.LEAD_NEW) {
        queryObj.user = req.user.id;
      }
    }

    const paginationCond = extractPaginationCondition(req);
    const stages = LeadService.generateStageGetLeads(queryObj, paginationCond);
    logger.info('LeadController::getList stage: ', JSON.stringify(stages));
    const result = await LeadModel.aggregate(stages);
    const totalItems = result[0].meta.length > 0 ? result[0].meta[0].totalItems : 0;
    const entries = result[0].entries.map(item => {
      if (item.campaignInfo && item.campaignInfo.length === 1) {
        item.campaign = {
          _id: item.campaignInfo[0]._id,
          name: item.campaignInfo[0].name
        };
      } else {
        item.campaign = null;
      }

      if (queryObj.status === global.STATUS.LEAD_NEW) {
        item.phone = `${item.phone.slice(0, 3)}*******`;
      }

      delete item.campaignInfo;
      delete item.deleteFlag;
      return item;
    });

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {
        meta: {
          totalItems,
          limit: paginationCond.limit,
          page: paginationCond.page
        },
        entries: entries
      }
    });
  } catch (e) {
    logger.error('LeadController::getListLead::error', e);
    return next(e);
  }
};

module.exports = {
  createLead,
  getListLead
};
