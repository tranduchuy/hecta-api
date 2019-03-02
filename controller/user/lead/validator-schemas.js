const getList = {
  type: 'object',
  additionalProperties: true,
  properties: {
    campaignId: {
      type: 'string'
    },
    page: {
      type: 'string',
      pattern: '\\d+'
    },
    limit: {
      type: 'string',
      pattern: '\\d+'
    }
  },
  required: ['campaignId']
};

module.exports = {
  LIST: getList
};
