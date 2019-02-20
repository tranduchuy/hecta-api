const campaignTypeConstant = require('../../constants/campaign-type');

const createSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
      minLength: 3
    },
    leadMinPrice: {
      type: 'number',
      minimum: 0
    },
    leadMaxPrice: {
      type: 'number'
    },
    downtime: {
      type: 'number',
      minimum: 5
    },
    downPriceStep: {
      type: 'number',
      minimum: 100000
    },
    campaignType: {
      enum: [campaignTypeConstant.PROJECT, campaignTypeConstant.LOCATION]
    },
    formality: {
      type: 'number'
    },
    type: {
      type: 'number'
    },
    city: {
      type: 'string'
    },
    district: {
      type: 'number'
    },
    project: {
      type: 'string'
    },
    domains: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    isPrivate: {
      type: 'boolean'
    },
    user: {
      type: 'number'
    }
  },
  required: ['name', 'leadMinPrice', 'leadMaxPrice', 'downtime', 'downPriceStep', 'campaignType', 'formality', 'type', 'city'],
  switch: [
    {
      if: {required: ['password']},
      then: {required: ['oldPassword', 'confirmedPassword']},
      continue: true
    }
  ]
};

module.exports = {
  CREATE: createSchema
};