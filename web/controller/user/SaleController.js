const SaleModel = require('../../models/SaleModel');
const PostModel = require('../../models/PostModel');
const TagModel = require('../../models/TagModel');
const PostPriorityModel = require('../../models/PostPriorityModel');
const urlSlug = require('url-slug');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const NotifyController = require('./NotifyController');
const Socket = require('../../utils/Socket');
const NotifyContent = require('../../config/notify-content');
const NotifyTypes = require('../../config/notify-type');
const SocketEvents = require('../../config/socket-event');
const HTTP_CODE = require('../../config/http-code');
const ImageService = require('../../services/ImageService');
const postService = require("../../services/PostService");
const Request = require('../../utils/Request');
const { get, post, put, del } = require('../../utils/Request');
const CDP_APIS = require('../../config/cdp-url-api.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');

const checkValidUserToUpdate = (postUserId, user) => {
	if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(user.role) !== -1) {
		return true;
	}

	return postUserId.toString() === user.id.toString();
};

const add = async (req, res, next) => {
	const user = req.user;
	const {
					title, formality, type, city, district, ward,
					street, project, area, price, unit, address,
					keywordList, description, streetWidth, frontSize,
					direction, balconyDirection, floorCount, bedroomCount,
					toiletCount, furniture, images, contactName,
					contactAddress, contactPhone, contactMobile,
					contactEmail, priority, from, to, captchaToken,
					createdByType, cpv, paidForm, budgetPerDay, googleAddress
				} = req.body;

	try {
		const priorityObj = await PostPriorityModel.findOne({ priority });
		const dateCount = (to - from) / (1000 * 60 * 60 * 24);

		if (!priorityObj) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Không tìm thấy loại tin vip'
			});
		}

		if (dateCount < priorityObj.minDay) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: `Tổng số ngày nhỏ hơn số ngày tối thiểu của loại tin. Ít nhất ${priorityObj.minDay}`
			});
		}

		if (!title || title.length < 30 || title.length > 99) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Tiêu đề không hợp lệ'
			});
		}

		if (!formality || formality.length == 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Loại hình bất động sản không hợp lệ'
			});
		}

		if (!type || type.length == 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Loại bất động sản không hợp lệ'
			});
		}

		if (!city || city.length == 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Tỉnh / thành phố là thông tin bắt buộc'
			});
		}

		if (!district || district.length == 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Quận/huyện là thông tin bắt buộc'
			});
		}

		if (!description || description.length < 30) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Mô tả không hợp lệ'
			});
		}

		if (!contactMobile || contactMobile.length < 8 || contactMobile.length > 11) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Số điện thoại liên hệ : "' + contactMobile + '" không hợp lệ'
			});
		}

		if (!captchaToken || captchaToken.length == 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Captcha : "' + captchaToken + '" không hợp lệ'
			});
		}


		var sale = new SaleModel();
		var post = new PostModel();

		if (req.user) {
			post.user = req.user.id;
		}

		post.paymentStatus = global.STATUS.PAYMENT_UNPAID;

		if (createdByType) {
			const duplicateTitle = await SaleModel.findOne({ title: req.body.title });
			if (duplicateTitle) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'Crawler duplicate title'
				});
			}
		}

		sale.title = title;

		sale.formality = formality;
		sale.type = type;
		sale.city = city;
		sale.district = district;
		sale.ward = ward;
		sale.street = street;
		sale.project = project;
		sale.code = await postService.generateSaleCode();

		sale.areaData = area;
		sale.priceData = price * postService.detectMultiplesByUnit(unit);
		sale.area = postService.convertValueAreaToID(area);
		sale.price = postService.convertValueSalePriceToID(price, formality);

		sale.unit = unit;
		sale.address = address;

		sale.keywordList = keywordList;
		sale.googleAddress = googleAddress.text;
		sale.geo = {
			latitude : googleAddress.latitude,
			longitude: googleAddress.longitude
		};
		sale.description = description;

		sale.frontSize = frontSize;
		sale.streetWidth = streetWidth;
		sale.direction = direction;
		sale.balconyDirection = balconyDirection;
		sale.floorCount = floorCount;
		sale.bedroomCount = bedroomCount;
		sale.toiletCount = toiletCount;
		sale.furniture = furniture;

		sale.images = images;
		sale.contactName = contactName;
		sale.contactAddress = contactAddress;
		sale.contactPhone = contactPhone;
		sale.contactMobile = contactMobile;
		sale.contactEmail = contactEmail;

		sale.cpv = cpv;
		sale.adRank = cpv;
		sale.paidForm = paidForm;
		sale.isValidBalance = true;
		sale.budgetPerDay = budgetPerDay;
		ImageService.postConfirmImage(images);

		if (createdByType) {
			sale.createdByType = createdByType;
			sale.status = global.STATUS.ACTIVE;
		} else {
			sale.createdByType = global.CREATED_BY.HAND;
		}

		sale = await sale.save();

		post.postType = global.POST_TYPE_SALE;
		post.type = sale.type;
		post.contentId = new ObjectId(sale._id);
		post.priority = priorityObj.priority;
		post.from = from;
		post.to = to;
		post.formality = sale.formality;
		if (createdByType) {
			post.status = global.STATUS.ACTIVE;
		} else {
			post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
		}

		var url = urlSlug(title);
		let countDuplicate = await PostModel.countDocuments({ url: url });
		if (countDuplicate > 0) url = url + "-" + countDuplicate;

		post.url = url;

		if (keywordList && keywordList.length > 0) {
			for (var i = 0; i < keywordList.length; i++) {
				var key = keywordList[i];

				var slug = urlSlug(key);

				if (!slug) {
					continue;
				}

				var tag = await TagModel.findOne({ status: global.STATUS.ACTIVE, slug: slug });

				if (!tag) {
					tag = new TagModel({
						slug   : slug,
						keyword: key,
					});
					tag = await tag.save();
				}
				post.tags.push(tag._id);
			}
		}

		post = await post.save();
		const postData = {
			saleId: sale._id,
			cost  : dateCount * priorityObj.costByDay
		};

		logger.info('SaleController::add::call cdp purchase', { postData, dateCount, costPerDay: priorityObj.costByDay });

		Request.post(CDP_APIS.USER.SALE_COST, postData, req.user ? req.user.token : '')
			.then(async r => {
				post.paymentStatus = global.STATUS.PAYMENT_PAID;
				await post.save();
				logger.info(`SaleController::add success call CDP sale cost, note post id ${post._id}`);
				// notify
				const notifyParams = {
					fromUserId: null,
					toUserId  : user.id,
					title     : NotifyContent.PayPost.Title,
					content   : NotifyContent.PayPost.Content,
					type      : NotifyTypes.CHANGE_TRANSACTION,
					params    : {
						cost: dateCount * priorityObj.costByDay
					}
				};
				NotifyController.createNotify(notifyParams);

				// send socket
				notifyParams.toUserIds = [notifyParams.toUserId];
				delete notifyParams.toUserId;
				Socket.broadcast(SocketEvents.NOTIFY, notifyParams);
				logger.info('SaleController::add::success. Create post sale successfully');

				return res.json({
					status : HTTP_CODE.SUCCESS,
					data   : post,
					message: 'Đăng tin thành công. Vui lòng chờ admin kiểm duyệt'
				});
			})
			.catch(e => {
				if (e === 'Balance expired') {
					logger.info('SaleController::add::error. Balance expired when create post id: ', post._id);
					return res.json({
						status : HTTP_CODE.ERROR,
						message: 'Tạo tin thành công tuy nhiên ví tiền của bạn hết hạn sử dụng. Vui lòng vào phần quản lý tin đăng để thanh toán sau này'
					});
				} else if (e === 'Not enough money') {
					logger.info('SaleController::add::error. Not enough money when create post id: ', post._id);
					return res.json({
						status : HTTP_CODE.ERROR,
						message: 'Tạo tin thành công tuy nhiên bạn không đủ tiền thanh toán. Vui lòng vào phần quản lý tin đăng để thanh toán sau này'
					});
				}

				logger.error('SaleController::add::error', e);
				return next(e);
			});
	} catch (e) {
		logger.error('SaleController::add::error', e);
		return next(e);
	}
};

const upNew = async (req, res, next) => {
	logger.info('UserController::upNew::called');

	try {
		let id = req.params.id;
		let post = await PostModel.findOne({ _id: id });

		if (!post || post.postType !== global.POST_TYPE_SALE) {
			return next(new Error('post not exist'));
		}

		if (post.user.toString() !== req.user.id.toString()) {
			return next(new Error('Permission denied'));
		}

		const priority = await PostPriorityModel.findOne({ priority: post.priority });
		let price = 0;
		if (priority) {
			price = priority.costByDay;
		}

		const postData = {
			cost  : price,
			saleId: post.contentId.toString()
		};
		Request.post(CDP_APIS.USER.UP_NEW, postData, req.user.token)
			.then(async r => {
				logger.info('UserController::upNew call CDP up new successfully', postData);
				post.refresh = Date.now();
				await post.save();
				// notify
				const notifyParams = {
					fromUserId: null,
					toUserId  : req.user.id,
					title     : NotifyContent.UpNew.Title,
					content   : NotifyContent.UpNew.Content,
					type      : NotifyTypes.CHANGE_TRANSACTION,
					params    : {
						price
					}
				};
				NotifyController.createNotify(notifyParams);

				// send socket
				notifyParams.toUserIds = [notifyParams.toUserId];
				delete notifyParams.toUserId;
				Socket.broadcast(SocketEvents.NOTIFY, notifyParams);
				logger.info(`UserController::upNew::success. Purchase up new successfully, post id ${post._id.toString()}, price = ${price}`);

				return res.json({
					status : HTTP_CODE.SUCCESS,
					data   : {},
					message: 'Success'
				});
			})
			.catch(e => {
				if (e === 'Balance expired') {
					logger.info('SaleController::upNew::error. Balance expired when upNew post id: ', post._id);
					return res.json({
						status : HTTP_CODE.ERROR,
						message: 'Up tin không thành công vì ví tiền của bạn hết hạn sử dụng'
					});
				} else if (e === 'Not enough money') {
					logger.info('SaleController::upNew::error. Not enough money when create post id: ', post._id);
					return res.json({
						status : HTTP_CODE.ERROR,
						message: 'Up tin không thành công vì bạn không đủ tiền thanh toán'
					});
				}

				logger.error('UserController::upNew::error', e);
				return next(e);
			});
	} catch (e) {
		logger.error('UserController::upNew::error', e);
		return next(e);
	}
};

const update = async function (req, res, next) {

	try {
		let id = req.params.id;
		logger.info(`SaleController::update::called with post id ${id}. Updating user id: ${req.user.id}`);

		if (!id || id.length === 0) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'id invalid '
			});
		}

		let post = await PostModel.findOne({ _id: id });
		if (!post || post.postType !== global.POST_TYPE_SALE) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Không tìm thấy tin đăng'
			});
		}

		if (!checkValidUserToUpdate(post, req.user)) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'Không có quyền'
			});
		}

		var sale = await SaleModel.findOne({ _id: post.contentId });
		if (!sale) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'sale not exist '
			});
		}

		let {
					title, formality, type, city, district, ward, street, project, area,
					price, unit, address, keywordList, description, streetWidth, frontSize,
					direction, balconyDirection, floorCount, bedroomCount, toiletCount,
					furniture, googleAddress, images, contactName, contactAddress,
					contactPhone, contactMobile, contactEmail, priority, status, from, to
				} = req.body;

		ImageService.putUpdateImage(sale.images || [], images || []);

		// var cpv = req.body.cpv;
		// var paidForm = req.body.paidForm;
		// var budgetPerDay = req.body.budgetPerDay;

		// if (paidForm && paidForm != sale.paidForm) {
		//   return res.json({
		//     status: HTTP_CODE.ERROR,
		//     data: {},
		//     message: 'not update paidForm post '
		//   });
		// }

		if (title && (sale.title !== title)) {
			sale.title = title;
			let url = urlSlug(title);
			const countDuplicate = await PostModel.countDocuments({ url });
			if (countDuplicate > 0) {
				url += "-" + countDuplicate;
			}

			post.url = url;
		}

		let fields = ['formality', 'type', 'city', 'district', 'ward', 'street', 'project',
			'unit', 'address', 'keywordList', 'description', 'streetWidth', 'frontSize',
			'direction', 'balconyDirection', 'floorCount', 'bedroomCount', 'toiletCount',
			'furniture', 'images', 'contactName', 'contactAddress', 'contactPhone', 'contactMobile',
			'contactEmail'];

		fields.forEach(f => {
			if (req.body[f]) {
				sale[f] = req.body[f];
			}
		});


		if (area) {
			sale.areaData = area;
			sale.area = postService.convertValueAreaToID(area);
		}
		if (price) {
			sale.priceData = price * postService.detectMultiplesByUnit(sale.unit);
			sale.price = postService.convertValueSalePriceToID(price, formality);
		}

		if (googleAddress) {
			sale.googleAddress = googleAddress.text;
			sale.geo = {
				latitude : googleAddress.latitude,
				longitude: googleAddress.longitude
			};
		}

		// ADMIN, MASTER not send status in this api. they have another api to update status
		if (status === global.STATUS.DELETE) {
			sale.status = status;
			post.status = status;
		} else {
			sale.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
			post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
		}

		// if (sale.paidForm == global.PAID_FORM.VIEW) {
		//   if (cpv)
		//     sale.cpv = cpv;
		//   if (budgetPerDay)
		//     sale.budgetPerDay = budgetPerDay;
		// }

		sale = await sale.save();

		post.type = sale.type;
		post.priority = sale.priority;

		if (from) {
			post.from = from;
			post.refresh = Date.now();

		}

		if (to) {
			post.to = to;
		}

		if (priority) {
			post.priority = priority;
		}

		if (keywordList && keywordList.length > 0) {
			for (let i = 0; i < keywordList.length; i++) {
				let key = keywordList[i];
				let slug = urlSlug(key);
				if (!slug) {
					continue;
				}

				let tag = await TagModel.findOne({ status: global.STATUS.ACTIVE, slug: slug });
				if (!tag) {
					tag = new TagModel({
						slug   : slug,
						keyword: key,
					});
					tag = await tag.save();
				}

				post.tags.push(tag._id);
			}
		}

		await post.save();
		return res.json({
			status : HTTP_CODE.SUCCESS,
			data   : sale,
			message: 'update success'
		});
	} catch (e) {
		return next(e);
	}
};

const buyContactOfSale = async (req, res, next) => {
	logger.info('SaleController::buyContactOfSale::called');
	const { saleId } = req.body;
	try {
		const sale = await SaleModel.findOne({ _id: saleId });
		if (!sale) {
			return res.json({
				status : HTTP_CODE.ERROR,
				message: 'Không tìm thấy tin đăng',
				data   : {}
			});
		}

		const body = {
			saleId,
			cost: 1e5
		};

		await post(CDP_APIS.USER.BUY_LEAD, body, req.user.token);
		logger.info('SaleController::buyContactOfSale::success', body);

		return res.json({
			status : HTTP_CODE.SUCCESS,
			message: 'Thành công'
		})
	} catch (e) {
		if (e === 'Balance expired') {
			logger.info('SaleController::add::error. Balance expired when buy lead contact phone', { saleId });
			return res.json({
				status : HTTP_CODE.ERROR,
				message: 'Ví hết hạn sử dụng'
			});
		} else if (e === 'Not enough money') {
			logger.info('SaleController::add::error. Not enough money when buy lead contact phone: ', { saleId });
			return res.json({
				status : HTTP_CODE.ERROR,
				message: 'Không đủ số dư'
			});
		}

		logger.error('SaleController::buyContactOfSale::error', e);
		return next(e);
	}
};

const checkBoughtContact = async (req, res, next) => {
	logger.info('SaleController::checkBoughtContact::called', { saleId: req.query.saleId });
	try {
		const saleId = req.query.saleId;
		const url = `${CDP_APIS.USER.CHECK_BOUGHT_LEAD}?saleId=${saleId}`;
		const result = await get(url, req.user.token);

		return res.json({
			status : HTTP_CODE.SUCCESS,
			message: 'Success',
			data   : result.data
		});
	} catch (e) {
		logger.error('SaleController::checkBoughtContact::error', e);
		return next(e);
	}
};

const SaleController = {
	add,

	upNew,

	update,

	buyContactOfSale,

	checkBoughtContact,

	updateAdStatus: async function (req, res, next) {
		try {
			let id = req.params.id;

			if (!id || id.length == 0) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'id invalid '
				});
			}

			let post = await PostModel.findOne({ _id: id });

			if (!post || post.postType != global.POST_TYPE_SALE) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'post not exist '
				});
			}

			if (post.user != req.user.id) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'user does not have permission !'
				});
			}

			var sale = await SaleModel.findOne({ _id: post.contentId });

			if (!sale) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'sale not exist '
				});
			}

			if (sale.paidForm != global.PAID_FORM.VIEW) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'paidForm is not view'
				});
			}

			var adStatus = req.body.adStatus;

			if (adStatus == global.STATUS.PAID_FORM_VIEW_ACTIVE)
				sale.adStatus = global.STATUS.PAID_FORM_VIEW_ACTIVE;

			if (adStatus == global.STATUS.PAID_FORM_VIEW_STOP)
				sale.adStatus = global.STATUS.PAID_FORM_VIEW_STOP;

			sale = await sale.save();

			return res.json({
				status : 1,
				data   : sale,
				message: 'update adStatus success'
			});
		} catch (e) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'unknown error : ' + e.message
			});
		}
	},

	updateAdStatus: async function (req, res, next) {
		try {
			let id = req.params.id;

			if (!id || id.length == 0) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'id invalid '
				});
			}

			let post = await PostModel.findOne({ _id: id });

			if (!post || post.postType != global.POST_TYPE_SALE) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'post not exist '
				});
			}

			if (post.user != req.user.id) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'user does not have permission !'
				});
			}

			var sale = await SaleModel.findOne({ _id: post.contentId });

			if (!sale) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'sale not exist '
				});
			}

			if (sale.paidForm != global.PAID_FORM.VIEW) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'paidForm is not view'
				});
			}

			var adStatus = req.body.adStatus;

			if (adStatus == global.STATUS.PAID_FORM_VIEW_ACTIVE)
				sale.adStatus = global.STATUS.PAID_FORM_VIEW_ACTIVE;

			if (adStatus == global.STATUS.PAID_FORM_VIEW_STOP)
				sale.adStatus = global.STATUS.PAID_FORM_VIEW_STOP;

			sale = await sale.save();

			return res.json({
				status : 1,
				data   : sale,
				message: 'update adStatus success'
			});
		} catch (e) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'unknown error : ' + e.message
			});
		}
	},

	updateCPV: async function (req, res, next) {
		try {
			let id = req.params.id;

			if (!id || id.length == 0) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'id invalid '
				});
			}

			let post = await PostModel.findOne({ _id: id });

			if (!post || post.postType != global.POST_TYPE_SALE) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'post not exist '
				});
			}

			if (post.user != req.user.id) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'user does not have permission !'
				});
			}

			var sale = await SaleModel.findOne({ _id: post.contentId });

			if (!sale) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'sale not exist '
				});
			}

			if (sale.paidForm != global.PAID_FORM.VIEW) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'paidForm is not view'
				});
			}

			var cpv = req.body.cpv;

			if (!cpv) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'cpv is not available'
				});
			}

			sale.cpv = cpv;

			sale = await sale.save();

			return res.json({
				status : 1,
				data   : sale,
				message: 'update cpv success'
			});
		} catch (e) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'unknown error : ' + e.message
			});
		}
	},

	updateBudgetPerDay: async function (req, res, next) {
		try {
			let id = req.params.id;

			if (!id || id.length == 0) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'id invalid '
				});
			}

			let post = await PostModel.findOne({ _id: id });

			if (!post || post.postType != global.POST_TYPE_SALE) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'post not exist '
				});
			}

			if (post.user != req.user.id) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'user does not have permission !'
				});
			}

			var sale = await SaleModel.findOne({ _id: post.contentId });

			if (!sale) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'sale not exist '
				});
			}

			if (sale.paidForm != global.PAID_FORM.VIEW) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'paidForm is not view'
				});
			}

			var budgetPerDay = req.body.budgetPerDay;

			if (!budgetPerDay) {
				return res.json({
					status : HTTP_CODE.ERROR,
					data   : {},
					message: 'budgetPerDay is not available'
				});
			}

			sale.budgetPerDay = budgetPerDay;

			sale = await sale.save();

			return res.json({
				status : 1,
				data   : sale,
				message: 'update budgetPerDay success'
			});
		} catch (e) {
			return res.json({
				status : HTTP_CODE.ERROR,
				data   : {},
				message: 'unknown error : ' + e.message
			});
		}
	},
};

module.exports = SaleController;
