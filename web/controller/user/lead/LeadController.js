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
  try {
    let session = null;
    let lead = null;
    let currentLeadPrice = null;
    LeadModel.createCollection()
      .then(() => LeadModel.startSession())
      .then(_session => {
        session = _session;
        session.startTransaction();
        console.log(1);
        return LeadModel.findOne({ _id: req.body.leadId }).session(session);

      })
      .then((_lead) => {
        if (!_lead) {
          new Error('Lead not found')
        }

        lead = _lead;
        console.log(2);
        return LeadService.getCurrentLeadPrice(_lead._id);
      })
      .then((_currentLeadPrice) => {
        currentLeadPrice = _currentLeadPrice;
        console.log(3);
        return LeadService.chargeBalanceByBuyingLead(JSON.stringify(lead), _currentLeadPrice, req.user.token);
      })
      .then(async (cdpResponse) => {
        lead.user = req.user.id;
        lead.price = currentLeadPrice;
        await LeadService.finishScheduleDownPrice(lead._id, session);

        console.log(4);
        return lead.save();
      })
      .then(() => {
        setTimeout(() => {
          console.log(5);
          session.commitTransaction();
          logger.info(`LeadController::buyLead::success`);

          res.json({
            status: HTTP_CODE.SUCCESS,
            message: 'Mua thành công lead',
            data: {}
          });
        }, 60 * 1000);

        return '';
      })
      .catch(e => {
        session.abortTransaction();
        logger.error('LeadController::buyLead::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('LeadController::buyLead::error', e);
    return next(e);
  }
};

const getDetailLead = async (req, res, next) => {
  logger.info('LeadController::getDetailLead::called');
  try {
    let id = req.params.id;
    if (!id || id.length == 0) return next(new Error('Id not valid'));

    let lead = await LeadModel.findOne({ _id: id }).lean();
    if (!lead) return next(new Error('Lead not found'));

    const campaignOfLead = await CampaignModel.findOne({ _id: lead.campaign }).lean();
    const leadPriceSchedule = await LeadPriceScheduleModel.findOne({ lead: id }).lean();
    const leadHistory = await LeadHistoryModel.find({ lead: id }).sort({ createAt: 1 });
    const newestLeadHistory = leadHistory[0];

    let result = {
      _id: lead._id,
      createdAt: newestLeadHistory.createAt,
      bedrooms: newestLeadHistory.bedrooms,
      bathrooms: newestLeadHistory.bathrooms,
      name: newestLeadHistory.name,
      area: newestLeadHistory.area,
      price: newestLeadHistory.price,
      street: newestLeadHistory.street,
      direction: newestLeadHistory.direction,
      location: LeadService.getLeadLocation(campaignOfLead),
      leadPrice: lead.price,
      timeToDownPrice: leadPriceSchedule.downPriceAt,
      type: LeadService.getTypeOfLead(campaignOfLead),
    }
    if ([global.STATUS.LEAD_SOLD, global.STATUS.LEAD_FINISHED].includes(lead.status)) {
      result.phone = lead.phone;
      result.email = lead.email;
    }

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: result,
    });
  } catch (error) {
    return next(new Error('Unknow error ' + error.message));
  }
}

module.exports = {
  createLead,
  getListLead,
  buyLead,
  getDetailLead
};
