const log4js = require('log4js');
const UrlParamModel = require('../models/UrlParamModel');
const logger = log4js.getLogger('Services');

/**
 * Input: _id, query<{formality, type, city, district, ward}>
 * Output: <url, customUrl, _id>[]
 */
const getRelatedUrlParams = async (urlParamId, query, options) => {
    logger.info(`UrlParamService::getRelatedUrlParams is called with id=${urlParamId}, query=${JSON.stringify(query)}`);
    try {
        options = options || {};

        const urlParam = await UrlParamModel.findOne({_id: urlParamId}).lean();
        if(!urlParam) {}
    } catch (e) {
        logger.error('UrlParamService::getRelatedUrlParams::error', e);
        return [];
    }
};

module.exports = {
    getRelatedUrlParams
};