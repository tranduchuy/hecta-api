const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const SystemModel = require('../models/SystemModel');
const SaleModel = require('../models/SaleModel');
const BuyModel = require('../models/BuyModel');
const NewsModel = require('../models/NewsModel');
const ProjectModel = require('../models/ProjectModel');
const HttpCode = require('../config/http-code');

const getStatisticInfo = async (req, res, next) => {
    logger.info('SystemController::getStatisticInfo is called');

    try {
        const config = await SystemModel.findOne();
        const countCrawledSale = SaleModel.countDocuments({createdByType: global.CREATED_BY.CRAWL});
        const countCrawledBuy = BuyModel.countDocuments({createdByType: global.CREATED_BY.CRAWL});
        const countCrawledNews = NewsModel.countDocuments({createdByType: global.CREATED_BY.CRAWL});
        const countCrawledProject = ProjectModel.countDocuments({createdByType: global.CREATED_BY.CRAWL});

        return res.json({
            status: HttpCode.SUCCESS,
            message: '',
            data: {
                crawl: {
                    sale: {
                        total: config.crawl.sale,
                        finished: countCrawledSale
                    },
                    buy: {
                        total: config.crawl.buy,
                        finished: countCrawledBuy
                    },
                    news: {
                        total: config.crawl.news,
                        finished: countCrawledNews
                    },
                    project: {
                        total: config.crawl.project,
                        finished: countCrawledProject
                    }
                }
            }
        });

    } catch (e) {
        logger.error('SystemController::getStatisticInfo::error', e);
        return next(e);
    }
};

const updateConfig = async (req, res, next) => {
    logger.info('SystemController::updateConfig is called');

    try {
        const admin = req.user;

        // TODO check role admin to update
        const { crawl } = req.body;

        if (!crawl) {
            return res.json({
                status: HttpCode.BAD_REQUEST,
                message: ['Nothing to update'],
                data: {}
            });
        }

        const config = await SystemModel.findOne();
        Object.assign(config.crawl, crawl);

        await config.save();

        return res.json({
            status: HttpCode.SUCCESS,
            message: 'Success',
            data: {}
        });
    } catch (e) {
        logger.error('SystemController::updateConfig::error', e);
        return next(e);
    }
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
    updateConfig,
    getStatisticInfo
};