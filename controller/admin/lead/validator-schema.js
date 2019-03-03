const statusEnum = [
  global.STATUS.LEAD_NEW.toString(),
  global.STATUS.LEAD_FINISHED.toString(),
  global.STATUS.LEAD_RETURNING.toString(),
  global.STATUS.LEAD_SOLD.toString()
];

const getList = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      pattern: '\\d+'
    },
    campaignId: {
      type: 'string'
    },
    phone: {
      type: 'string',
      pattern: '\\d+',
      minLength: 10,
      maxLength: 12
    },
    page: {
      type: 'string',
      pattern: '\\d+'
    },
    limit: {
      type: 'string',
      pattern: '\\d+'
    },
    status: {
      enum: statusEnum
    }
  },
  required: [],
  errorMessage: {
    properties: {
      campaignId: 'Campaign id should be string id mongo',
      projectId: 'Project id should be string id mongo',
      page: 'Page should be number from 1,2,3...',
      limit: 'Limit should be number',
      status: 'Status must be in enum ' + statusEnum.join(',')
    }
  }
};

module.exports = {
  LIST: getList
};
