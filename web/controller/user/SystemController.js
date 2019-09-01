const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const SystemModel = require('../../models/SystemModel');
const SaleModel = require('../../models/SaleModel');
const HttpCode = require('../../config/http-code');

const getStatisticInfo = async (req, res, next) => {
  logger.info('SystemController::getStatisticInfo is called');

  try {
    const config = await SystemModel.findOne({});
    const notHandleSalePost = await SaleModel.countDocuments({
      status: STATUS.PENDING_OR_WAIT_COMFIRM
    });

    return res.json({
      status: HttpCode.SUCCESS,
      message: '',
      data: {
        crawl: {
          sale: {
            total: await SaleModel.count(),
            notHandle: notHandleSalePost
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
    const { crawl } = req.body;
    const admin = req.user;

    if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
      return next(new Error('Permission denied'));
    }

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
    const config = await SystemModel.findOne().lean();
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

const updateStaticPageContent = async (req, res, next) => {
  try {
    const fields = [
      "hoTro",
      "chinhSach",
      "huongDanSuDung",
      "lienHe",
      "coCheGiaiQuyetTranhChap",
      "dieuKhoanThoaThuan",
      "baoGia",
      "baoVeThongTinCaNhan"
    ];

    const config = await SystemModel.findOne({});
    fields.forEach(f => {
      if (req.body[f] && req.body[f].trim() !== '') {
        config.staticPage[f].push({
          createdAt: new Date,
          content: req.body[f].trim()
        });
      }
    });

    await config.save();
    return res.json({
      status: HttpCode.SUCCESS,
      message: 'Success',
      data: {}
    });
  } catch (e) {
    logger.error('SystemController::updateStaticPageContent::error', e);
    return next(e);
  }
};

const getStaticPageContents = async (req, res, next) => {
  try {
    const config = await SystemModel.findOne({});
    const fields = [
      "hoTro",
      "chinhSach",
      "huongDanSuDung",
      "lienHe",
      "coCheGiaiQuyetTranhChap",
      "dieuKhoanThoaThuan",
      "baoGia",
      "baoVeThongTinCaNhan"
    ];

    const result = {};
    fields.forEach(f => {
      result[f] = config.staticPage[f].slice(-1).pop();
    });

    return res.json({
      status: HttpCode.SUCCESS,
      message: 'Success',
      data: result
    });
  } catch (e) {
    logger.error('SystemController::getStaticPageContents::error', e);
    return next(e);
  }
};

module.exports = {
  getDefaultSystemConfig,
  updateConfig,
  getStatisticInfo,
  updateStaticPageContent,
  getStaticPageContents
};
