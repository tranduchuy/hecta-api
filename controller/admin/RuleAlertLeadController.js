const _ = require('lodash');
const RuleAlertLeadModel = require('../../models/RuleAlertLeadModel');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const HTTP_CODE = require('../../config/http-code');
const {extractPaginationCondition} = require('../../utils/RequestUtil');

const list = async (req, res, next) => {
  logger.info('Admin/RuleAlertLeadController::list is called');
  
  try {
    if (!RoleService.isAdmin(req.user)) {
      return next(new Error('Permission denied'));
    }
    
    let stages = generateStageQueryRule(req);
    
    logger.info('Admin/RuleAlertLeadController::list. Aggregate stages: ', JSON.stringify(stages));
    
    const results = await RuleAlertLeadModel.aggregate(stages);
    return res.json({
      status: HTTP_CODE.SUCCESS,
      data: {
        entries: results[0].entries,
        meta: {
          totalItems: results[0].entries.length > 0 ? results[0].meta[0].totalItems : 0
        }
      },
      message: 'Success'
    });
  } catch (e) {
    logger.error('Admin/RuleAlertLeadController::list2::error', e);
    return next(e);
  }
};

const generateStageQueryRule = (req) => {
  const {userId, formality, type, city, project, status, dateFrom, dateTo} = req.query;
  const pageCond = extractPaginationCondition(req);
  
  const stages = [
    {
      '$lookup': {
        'from': 'Projects',
        'localField': 'project',
        'foreignField': '_id',
        'as': 'projectInfo'
      }
    },
    {
      '$unwind': {'path': '$projectInfo'}
    },
    {
      $sort: {
        updatedAt: -1
      }
    },
  ];
  
  // filter
  const stageFilter = {};
  
  if (userId && !isNaN(userId)) {
    stageFilter['status'] = parseInt(status);
  }
  
  if (formality && !isNaN(formality)) {
    stageFilter['formality'] = parseInt(formality);
  }
  
  if (type && !isNaN(type)) {
    stageFilter['type'] = parseInt(type);
  }
  
  if (city) {
    stageFilter["city"] = city;
  }
  
  if (project) {
    stageFilter["project"] = project;
  }
  
  if (status && !isNaN(status)) {
    stageFilter["status"] = status;
  }
  
  
  // filter date by query dateFrom and dateTo
  if (dateFrom || dateTo) {
    const dateFilterObj = {};
    
    if (dateFrom && dateFrom.toString().length === 10) {
      const fromObj = moment(dateFrom, 'YYYY-MM-DD').toDate();
      dateFilterObj['$gte'] = fromObj.getTime()
    }
    
    if (dateTo && dateTo.toString().length === 10) {
      const toObj = moment(dateTo, 'YYYY-MM-DD').toDate();
      dateFilterObj['$lte'] = toObj.getTime();
    }
    
    if (Object.keys(dateFilterObj).length !== 0) {
      stageFilter['updatedAt'] = dateFilterObj;
    }
  }
  
  if (Object.keys(stageFilter).length !== 0) {
    stages.push({
      $match: stageFilter
    });
  }
  
  // pagination
  stages.push({
    $facet: {
      entries: [
        {$skip: (pageCond.page - 1) * pageCond.limit},
        {$limit: pageCond.limit},
      ],
      meta: [
        {$group: {_id: null, totalItems: {$sum: 1}}},
      ],
    },
  });
  
  return stages;
};


const RuleAlertLeadController = {
  list,
};

module.exports = RuleAlertLeadController;
