const log4js = require('log4js');
const _ = require('lodash');
const logger = log4js.getLogger('Controllers');
const moment = require('moment');
const LeadModel = require('../../../models/LeadModel');
const CampaignModel = require('../../../models/CampaignModel');
const LeadHistoryModel = require('../../../models/LeadHistoryModel');
const LeadPriceScheduleModel = require('../../../models/LeadPriceScheduleModel');
const LeadService = require('./LeadService');
const Validator = require('../../../utils/Validator');
const HTTP_CODE = require('../../../config/http-code');
const LEAD_VALIDATE_SCHEMA = require('./validator-schemas');
const AJV = require('../../../services/AJV');
const { extractPaginationCondition } = require('../../../utils/RequestUtil');
const { post, get, del, put } = require('../../../utils/Request');
const CDP_APIS = require('../../../config/cdp-url-api.constant');

const createLead = async (req, res, next) => {
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

    let campaign = await CampaignModel.findOne({ _id: campaignId });
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

    let { status } = req.query;
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
      if (queryObj.status === global.STATUS.LEAD_NEW) {
        item.phone = `${item.phone.slice(0, 3)}*******`;
      }

      if (item.priceSchedule.length !== 0) {
        item.price = item.priceSchedule[0].price;
        item.timeToDownPrice = item.priceSchedule[0].downPriceAt;
        item.ahihi = true;
      } else {
        item.price = item.campaignInfo.leadMaxPrice;
        item.timeToDownPrice = moment().add(item.campaignInfo.downTime, 'minutes');
      }

      item.location = LeadService.getLeadLocation(item.campaignInfo);
      item.type = LeadService.getTypeOfLead(item.campaignInfo);
      item.createdAt = item.createdAt || null;

      delete item.histories;
      delete item.deleteFlag;
      delete item.user;
      delete item.status;
      delete item.campaign;
      delete item.__v;
      delete item.note;
      delete item.priceSchedule;
      delete item.campaignInfo;

      return item;
    });

    // lead: {typeStr, location (project name, district, city), price, createdAt, timeToDownPrice }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {
        meta: {
          currentItemsCount: entries.length,
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

const buyLead = async (req, res, next) => {
  logger.info('LeadController::buyLead::called');
  // TODO
  /* Step - This code trust demo how implement transaction in mongoose
  * 1. Check balance info (call to CDP apis)
  * 2. Commit buy lead
  * 3. Charge balance by buying lead (call to CDP apis)
  * */
 let session = null;
  try {
    // get user balance
    const userInfo = (await get(CDP_APIS.USER.INFO, req.user.token)).data.entries[0];
    const balance = userInfo.balance;
    // start session
    session = await LeadModel.createCollection().then(() => LeadModel.startSession());
    // step 1 get lead
    const lead = await LeadModel.findOne({ _id: req.body.leadId }).session(session);
    if (!lead) throw new Error('Lead not found');
    // step 2 get current price and check with balance
    const currentPrice = await LeadService.getCurrentLeadPrice(lead._id);
    if (balance.main1 < currentPrice) throw new Error("Số dư tài khoản không đủ");
    // step 3 buy lead, change balance of user + update lead
    await LeadService.chargeBalanceByBuyingLead(JSON.stringify(lead), currentPrice, req.user.token);
    lead.user = req.user.id;
    lead.price = currentPrice;
    lead.boughtAt = new Date();
    await LeadService.finishScheduleDownPrice(lead._id, session);
    session.commitTransaction();

    res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Mua thành công lead',
      data: {}
    });
  } catch (e) {
    session.abortTransaction();
    logger.error('LeadController::buyLead::error', e);
    return next(e);
  }
};

const getDetailLead = async (req, res, next) => {
  logger.info('LeadController::getDetailLead::called');
  try {
    let id = req.params.id;
    if (!id || id.length === 0) {
      return next(new Error('Id lead không hợp lệ'));
    }

    let lead = await LeadModel.findOne({ _id: id }).lean();
    if (!lead) {
      return next(new Error('Không tìm thấy lead'));
    }

    const campaignOfLead = await CampaignModel.findOne({ _id: lead.campaign }).lean();
    const leadPriceSchedule = await LeadPriceScheduleModel.findOne({ lead: id }).lean();
    const leadHistory = await LeadHistoryModel.find({ lead: id }).sort({ createdAt: 1 });
    const newestLeadHistory = leadHistory[0];

    let result = {
      _id: lead._id,
      createdAt: newestLeadHistory.createdAt || null,
      bedrooms: newestLeadHistory.bedrooms || null,
      bathrooms: newestLeadHistory.bathrooms || null,
      name: newestLeadHistory.name,
      area: newestLeadHistory.area,
      price: newestLeadHistory.price,
      street: newestLeadHistory.street,
      direction: newestLeadHistory.direction,
      location: LeadService.getLeadLocation(campaignOfLead),
      leadPrice: lead.price,
      status: lead.status,
      timeToDownPrice: leadPriceSchedule.downPriceAt,
      type: LeadService.getTypeOfLead(campaignOfLead),
    };

    if ([global.STATUS.LEAD_SOLD, global.STATUS.LEAD_FINISHED, global.STATUS.LEAD_RETURNING].includes(lead.status)) {
      if (lead.user !== req.user.id) {
        return next(new Error('Bạn không được quyền coi lead này'));
      }

      result.phone = lead.phone;
      result.email = lead.email;
      result.address = newestLeadHistory.address || '';
      result.boughtAt = lead.boughtAt;
    }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: result,
    });
  } catch (error) {
    logger.error('LeadController::getDetailLead::error', error);
    return next(error);
  }
};

module.exports = {
  createLead,
  getListLead,
  buyLead,
  getDetailLead
};
