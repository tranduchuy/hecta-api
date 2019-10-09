const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const TemplateTypes = require('../../constants/template-types');
const WebsiteModel = require('../../models/WebsiteModel');
const SubDomainModel = require('../../models/SubDomainModel');
const TemplateModel = require('../../models/TemplateModel');
const HttpCode = require('../../config/http-code');
const mongoose = require('mongoose');
const config = require('config');
const subDomainPostFix = config.get('subDomainPostFix');

const createWebsite = async (req, res, next) => {
	logger.info('WebsiteController::createWebsite::called');
	try {
		const user = req.user;
		const { templateId, name, level, contactName,
						contactEmail, contactPhone, contactAddress } = req.body;

		const template = await TemplateModel.findOne({
			_id: templateId
		}).lean();

		if (!template) {
			return res.json({
				status: HttpCode.ERROR,
				message: 'Không tìm thấy template'
			});
		}

		const subDomain = await SubDomainModel.findOne({
			status: glbal.STATUS.DOMAIN_ENABLE
		});

		if (!subDomain) {
			return res.json({
				status: HttpCode.ERROR,
				message: 'Hệ thống chưa sẵn sàng. Hết domain con'
			});
		}

		const newWebsite = new WebsiteModel();
		newWebsite.template = mongoose.Types.ObjectId(templateId);
		newWebsite.user = req.user._id;
		newWebsite.name = name.trim();
		newWebsite.subDomain = subDomain._id;
		newWebsite.customDomain = '';

		if (level === 1) {
			newWebsite.contact = {
				name: contactName,
				email: contactEmail,
				phone: contactPhone,
				address: contactAddress
			}
		} else {
			// TODO: should generate database name, username, password
		}

		await newWebsite.save();

		return res.json({
			status: HttpCode.SUCCESS,
			message: 'Tạo website thành công',
			data: {
				domain: `${subDomain.name}.${subDomainPostFix}`
			}
		});
	} catch (e) {
		logger.error('WebsiteController::createWebsite::error', e);
		return next(e);
	}
};

module.exports = {
	createWebsite
};
