const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const HTTP_CODE = require('../config/http-code');
const RuleAlertLeadModel = require('../models/RuleAlertLeadModel');
const {extractPaginationCondition} = require('../utils/RequestUtil');

const register = async (req, res, next) => {
  logger.info('RuleAlertLeadController::register::called');

  try {
    const {city, district, project, formality, type} = req.body;

    const rule = new RuleAlertLeadModel();
    rule.userId = req.user.id;
    rule.formality = formality;
    rule.type = type;
    rule.city = city;
    rule.district = district;
    rule.project = project;
    rule.createdAt = new Date();
    rule.updatedAt = new Date();
    await rule.save();
    logger.info('RuleAlertLeadController::register::success');

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Add rule successfully',
      data: rule
    });
  } catch (e) {
    logger.error('RuleAlertLeadController::register::error', e);
    return next(e);
  }
};

const list = async (req, res, next) => {
  logger.info('RuleAlertLeadController::list::called');

  try {
    const paginationCond = extractPaginationCondition(req);
    const stages = [
      {
        $match: {
          userId: req.user.id
        }
      },
      {
        $sort: {
          updatedAt: 1
        }
      },
      {
        $facet: {
          entries: [
            {$skip: (paginationCond.page - 1) * paginationCond.limit},
            {$limit: paginationCond.limit}
          ],
          meta: [
            {$group: {_id: null, totalItems: {$sum: 1}}},
          ],
        }
      }
    ];

    const result = await RuleAlertLeadModel.aggregate(stages);
    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: {
        totalItems: result[0].meta.length > 0 ? result[0].meta[0].totalItems : 0,
        entries: result[0].entries
      }
    });
  } catch (e) {
    logger.error('RuleAlertLeadController::list::error', e);
    return next(e);
  }
};

const update = async (req, res, next) => {
  logger.info('RuleAlertLeadController::list::called');
  try {
    const {ruleId, city, district, project, formality, type} = req.body;
    const rule = await RuleAlertLeadModel.findOne({_id: ruleId});
    if (!rule) {
      return next(new Error('Rule not found'));
    }

    if (rule.userId !== req.user.id) {
      return next(new Error('Permission denied for updating'));
    }

    rule.formality = formality;
    rule.type = type;
    rule.city = city;
    rule.district = district;
    rule.project = project;
    rule.updatedAt = new Date();
    await rule.save();

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Success',
      data: rule
    })
  } catch (e) {
    logger.error('RuleAlertLeadController::list::error', e);
    return next(e);
  }
};

const remove = async (req, res, next) => {
  logger.info('RuleAlertLeadController::list::called');
  try {
    const ruleId = req.params.ruleId;
    const rule = await RuleAlertLeadModel.findOne({_id: ruleId});
    if (!rule) {
      return next(new Error('Rule not found'));
    }

    if (rule.userId !== req.user.id) {
      return next(new Error('Permission denied for updating'));
    }

    rule.status = global.STATUS.DELETE;
    await rule.save();

    return res.json({
      status: HTTP_CODE.SUCCESS,
      message: 'Remove rules successfully',
      data: {}
    })
  } catch (e) {
    logger.error('RuleAlertLeadController::list::error', e);
    return next(e);
  }
};

module.exports = {
  register,
  list,
  update,
  remove
};