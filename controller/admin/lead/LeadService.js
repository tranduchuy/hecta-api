const mongoose = require('mongoose');

const generateStageGetListLead = (queryObj, paginationCond) => {
  const stages = [];
  const $match = {};

  if (queryObj.status) {
    $match.status = queryObj.status;
  }

  if (queryObj.userId) {
    $match.user = userId;
  }

  if (queryObj.campaignId) {
    $match.campaign = new mongoose.Types.ObjectId(queryObj.campaignId);
  }

  if (queryObj.phone) {
    $match.phone = queryObj.phone;
  }

  if (Object.keys($match).length !== 0) {
    stages.push({$match});
  }

  // map campaign
  stages.push({
    '$lookup': {
      'from': 'Campaign',
      'localField': 'campaign',
      'foreignField': '_id',
      'as': 'campaignInfo'
    }
  });

  // map history
  stages.push({
    "$lookup": {
      "from": "LeadHistory",
      "localField": "lead",
      "foreignField": "_id",
      "as": "histories"
    }
  });

  stages.push({
    $facet: {
      entries: [
        {$skip: (paginationCond.page - 1) * paginationCond.limit},
        {$limit: paginationCond.limit}
      ],
      meta: [
        {$group: {_id: null, totalItems: {$sum: 1}}},
      ],
    }
  });
  return stages;
};

module.exports = {
  generateStageGetListLead
};
