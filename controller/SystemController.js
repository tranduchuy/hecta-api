const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const SystemModel = require('../models/SystemModel');
const HttpCode = require('../config/http-code');

const updateConfig = async (req, res, next) => {

};

const getDefaultSystemConfig = async (req, res, next) => {
    logger.info('SystemController::getDefaultSystemConfig is called');

    try {
        const config = await SystemModel.findOne();
        return res.json({
            status: HttpCode.SUCCESS,
            message: '',
            data: {
                entry: [config],
                meta: {}
            }
        });
    } catch (e) {
        logger.error('SystemController::getDefaultSystemConfig::error', e);
        return next(e);
    }
};

module.exports = {
    getDefaultSystemConfig,
    updateConfig
};