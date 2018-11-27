const PostModel = require('../models/PostModel');
const BuyModel = require('../models/BuyModel');
const TokenModel = require('../models/TokenModel');
const TagModel = require('../models/TagModel');
const urlSlug = require('url-slug');
const mongoose = require('mongoose');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const ImageService = require('../services/ImageService');
const StringService = require('../services/StringService');
const HttpCode = require('../config/http-code');

const BuyController = {
    add: async function (req, res, next) {
        logger.info('BuyController::add::called');

        const {
            title, description, keywordList, formality,
            type, city, district, ward, street, project,
            area, price, unit,
            address, images, contactName, contactAddress,
            contactPhone, contactMobile, contactEmail,
            receiveMail, from, to, createdByType
        } = req.body;

        const token = req.headers['accesstoken'];

        ImageService.postConfirmImage(images);
        try {
            if (StringService.isUndefinedOrNull(title) || title.length < 30 || title.length > 99) {
                return next(new Error('Invalid title'));
            }

            if (StringService.isNaN(formality)) {
                return next(new Error('Invalid formality'));
            }

            if (StringService.isNaN(from) || from <= 0) {
                return next(new Error('Invalid from date'));
            }

            if (StringService.isNaN(to) || to <= from) {
                return next(new Error('Invalid to date'));
            }

            if (StringService.isUndefinedOrNull(type) || type.toString().length === 0) {
                return next(new Error('Invalid type'));
            }

            if (StringService.isUndefinedOrNull(city) || city.toString() === '') {
                return next(new Error('Invalid city'));
            }

            if (StringService.isNaN(district)) {
                return next(new Error('Invalid district'));
            }

            if (StringService.isUndefinedOrNull(description) || description.length < 30) {
                return next(new Error('Invalid description'));
            }

            if (StringService.isUndefinedOrNull(contactMobile) || contactMobile.length < 8 || contactMobile.length > 11) {
                return next(new Error('Invalid contactMobile'));
            }

            let buy = new BuyModel();
            let post = new PostModel();

            if (token) {
                const accessToken = await TokenModel.findOne({token: token});
                if (!accessToken) {
                    return next(new Error('Invalid access token'));
                }

                post.user = accessToken.user;
            }

            if (createdByType) {
                const duplicateTitle = await BuyModel.findOne({title: req.body.title.trim()}).lean();
                if (duplicateTitle) {
                    return next(new Error('Crawling duplicate title'))
                }
            }

            buy.title = title;
            buy.description = description;
            buy.keywordList = keywordList;
            buy.formality = formality;
            buy.type = type;
            buy.city = city;
            buy.district = district;
            buy.ward = ward;
            buy.street = street;
            buy.project = project;
            buy.area = (area && (area > 0)) ? area : null;
            buy.price = (price && (price > 0)) ? price : null;
            buy.unit = unit;
            buy.address = address;
            buy.images = images;
            buy.contactName = contactName;
            buy.contactAddress = contactAddress;
            buy.contactPhone = contactPhone;
            buy.contactMobile = contactMobile;
            buy.contactEmail = contactEmail;
            buy.receiveMail = receiveMail;

            if (createdByType) {
                buy.createdByType = createdByType;
                buy.status = global.STATUS.ACTIVE;
            } else {
                buy.createdByType = global.CREATED_BY.HAND;
            }

            buy = await buy.save();
            let url = urlSlug(title);
            const countDuplicate = await PostModel.countDocuments({url});
            if (countDuplicate > 0) {
                url = url + '-' + countDuplicate;
            }

            post.url = url;
            post.postType = global.POST_TYPE_BUY;
            post.formality = buy.formality;
            post.type = buy.type;
            post.contentId = new mongoose.Types.ObjectId(buy._id);
            post.from = from;
            post.to = to;

            if (createdByType) {
                post.status = global.STATUS.ACTIVE;
                post.paymentStatus = global.STATUS.PAYMENT_PAID;
            } else {
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.paymentStatus = global.STATUS.PAYMENT_FREE;
            }

            if (keywordList && keywordList.length > 0) {
                for (let i = 0; i < keywordList.length; i++) {
                    const key = keywordList[i];
                    const slug = urlSlug(key);

                    if (!slug) {
                        break;
                    }

                    let tag = await TagModel.findOne({
                        status: global.STATUS.ACTIVE,
                        slug
                    }).lean();

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                        });

                        tag = await tag.save();
                    }

                    post.tags.push(tag._id);
                }
            }

            post = await post.save();
            logger.info('BuyController::add::success');

            return res.json({
                status: HttpCode.SUCCESS,
                data: post,
                message: 'Success'
            });
        } catch (e) {
            logger.error('BuyController::add::error', e);
            return next(e);
        }
    },

    update: async function (req, res, next) {
        // TODO:LAST to be continue refactoring this function

        try {

            var token = req.headers.accesstoken;


            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }

            let id = req.params.id;

            if (!id || id.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id invalid '
                });
            }


            let post = await PostModel.findOne({_id: id});

            if (!post || post.postType != global.POST_TYPE_BUY) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist '
                });
            }

            if (post.user != accessToken.user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }


            var buy = await BuyModel.findOne({_id: post.contentId});


            if (!buy) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'buy not exist '
                });
            }


            var title = req.body.title;
            var description = req.body.description;
            var keywordList = req.body.keywordList;

            var formality = req.body.formality;
            var type = req.body.type;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var street = req.body.street;
            var project = req.body.project;
            var area = req.body.area;
            var price = req.body.price;
            var unit = req.body.unit;

            var address = req.body.address;

            var images = req.body.images;

            var contactName = req.body.contactName;
            var contactAddress = req.body.contactAddress;
            var contactPhone = req.body.contactPhone;
            var contactMobile = req.body.contactMobile;
            var contactEmail = req.body.contactEmail;
            var receiveMail = req.body.receiveMail;

            var status = req.body.status;
            var from = req.body.from;
            var to = req.body.to;

            if (title && (buy.title != title)) {
                buy.title = title;

                var url = urlSlug(title);

                let countDuplicate = await PostModel.countDocuments({url: url});
                if (countDuplicate > 0) url = url + "-" + countDuplicate;

                post.url = url;
            }

            if (description) {
                buy.description = description;
            }
            if (keywordList) {
                buy.keywordList = keywordList;
            }


            if (formality) {
                buy.formality = formality;
            }
            if (type) {
                buy.type = type;
            }
            if (city) {
                buy.city = city;
            }
            if (district) {
                buy.district = district;
            }
            if (ward) {
                buy.ward = ward;
            }
            if (street) {
                buy.street = street;
            }
            if (project) {
                buy.project = project;
            }
            if (area) {

                buy.area = (area > 0) ? area : null;
            }
            if (price) {
                buy.price = (price > 0) ? price : null;
            }
            if (unit) {
                buy.unit = unit;
            }

            if (address) {
                buy.address = address;
            }
            if (images) {
                ImageService.putUpdateImage(buy.images, images);
                buy.images = images;
            }


            if (contactName) {
                buy.contactName = contactName;
            }
            if (contactAddress) {
                buy.contactAddress = contactAddress;
            }
            if (contactPhone) {
                buy.contactPhone = contactPhone;
            }
            if (contactMobile) {
                buy.contactMobile = contactMobile;
            }
            if (contactEmail) {
                buy.contactEmail = contactEmail;
            }
            if (receiveMail) {
                buy.receiveMail = receiveMail;
            }

            if (status == global.STATUS.DELETE) {
                buy.status = status;
            }

            buy.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
            buy = await buy.save();

            post.formality = buy.formality;
            post.type = buy.type;

            if (from) {
                post.from = from;
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.status = global.STATUS.PAYMENT_UNPAID;
                post.refresh = Date.now();
            }

            if (to) {
                post.to = to;
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.status = global.STATUS.PAYMENT_UNPAID;
            }

            if (status == global.STATUS.DELETE) {
                post.status = status;
            }

            post.tags = [];

            if (keywordList && keywordList.length > 0) {
                for (var i = 0; i < keywordList.length; i++) {
                    var key = keywordList[i];

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
                    }

                    var tag = await TagModel.findOne({slug: slug});

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                        });
                        tag = await tag.save();

                    }
                    post.tags.push(tag._id);

                }
            }
            await post.save();


            return res.json({
                status: 1,
                data: {},
                message: 'update success'
            });
        }


        catch (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }

    }

}
module.exports = BuyController
