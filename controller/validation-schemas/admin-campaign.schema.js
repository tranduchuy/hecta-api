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
    downTime: {
      type: 'number',
      minimum: 5
    },
    downPriceStep: {
      type: 'number',
      minimum: 100000
    },
    campaignType: {
      enum: [campaignTypeConstant.PROJECT, campaignTypeConstant.LOCATION],
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
    projectId: {
      type: 'string'
    },
    domains: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '//^((?:(?:(?:\\w[\\.\\-\\+]?)*)\\w)+)((?:(?:(?:\\w[\\.\\-\\+]?){0,62})\\w)+)\\.(\\w{2,6})$//'
      }
    },
    isPrivate: {
      type: 'boolean'
    },
    userId: {
      type: 'number'
    }
  },
  required: ['name', 'leadMinPrice', 'leadMaxPrice', 'downTime', 'downPriceStep', 'campaignType', 'formality', 'type', 'city', 'domains', 'isPrivate'],
  // switch: [
  //   {
  //     if: {
  //       properties: {
  //         isPrivate: {
  //           constant: true
  //         }
  //       }
  //     },
  //     then: {
  //       required: ['userId']
  //     }
  //   }
  // ]
};

const updateDomains = {
  type: 'object',
  properties: {
    domains: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '//^((?:(?:(?:\\w[\\.\\-\\+]?)*)\\w)+)((?:(?:(?:\\w[\\.\\-\\+]?){0,62})\\w)+)\\.(\\w{2,6})$//'
      }
    }
  },
  required: ['domains']
};

module.exports = {
  CREATE: createSchema,
  UPDATE_DOMAINS: updateDomains
};
