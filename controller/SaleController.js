const SaleModel = require('../models/SaleModel');
const PostModel = require('../models/PostModel');
const TagModel = require('../models/TagModel');
const TokenModel = require('../models/TokenModel');
const PostPriorityModel = require('../models/PostPriorityModel');
const UserModel = require('../models/UserModel');
const TransactionHistoryModel = require('../models/TransactionHistoryModel');
const UrlParamModel = require('../models/UrlParamModel');
const urlSlug = require('url-slug');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const NotifyController = require('../controller/NotifyController');
const Socket = require('../utils/Socket');
const NotifyContent = require('../config/notify-content');
const NotifyTypes = require('../config/notify-type');
const SocketEvents = require('../config/socket-event');
const HTTP_CODE = require('../config/http-code');
const ImageService = require('../services/ImageService');
const selector = require("../config/selector");
const postService = require("../services/PostService");

const checkUserPayment = async (user, post, price) => {
    if (!user) {
        return;
    }
    post.user = user._id;

    let purchaseStatus = await UserModel.purchase(user._id, price);

    if (purchaseStatus) {
        post.paymentStatus = global.STATUS.PAYMENT_PAID;
        await TransactionHistoryModel.addTransaction(user._id, undefined, price, 'post : ' + post.title, post._id, global.TRANSACTION_TYPE_PAY_POST, purchaseStatus.before, purchaseStatus.after);
    }

    await post.save();
};

const SaleController = {
    add: async function (req, res, next) {
        var token = req.headers.accesstoken;
        var user = undefined;

        if (token) {
            var accessToken = await  TokenModel.findOne({token: token});
            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });
            }

            user = await UserModel.findOne({_id: accessToken.user});
        }

        const {title, formality, type, city, district, ward,
            street, project, area, price, unit, address,
            keywordList, description, streetWidth, frontSize,
            direction, balconyDirection, floorCount, bedroomCount,
            toiletCount, furniture, images, contactName,
            contactAddress, contactPhone, contactMobile,
            contactEmail, priorityId, from, to, captchaToken,
            createdByType} = req.body;

        try {
            if (!priorityId || priorityId.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'priorityId : "' + priorityId + '" is invalid'
                });
            }

            var priority = await PostPriorityModel.findOne({_id: priorityId});
            var dateCount = (to - from) / (1000 * 60 * 60 * 24);

            if (!priority) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'priority not found'
                });
            }

            if (dateCount < priority.minDay) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post day count <  min day '
                });
            }

            if (!title || title.length < 30 || title.length > 99) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'title : "' + title + '" is invalid'
                });
            }

            if (!formality || formality.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'formality : "' + formality + '" is invalid'
                });
            }

            if (!type || type.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'type : "' + type + '" is invalid'
                });
            }

            if (!city || city.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'city : "' + city + '" is invalid'
                });
            }

            if (!district || district.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'district : "' + district + '" is invalid'
                });
            }

            if (!description || description.length < 30) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'description : "' + description + '" is invalid'
                });
            }

            if (!contactMobile || contactMobile.length < 8 || contactMobile.length > 11) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'contactMobile : "' + contactMobile + '" is invalid'
                });
            }

            if (!captchaToken || captchaToken.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'captchaToken : "' + captchaToken + '" is invalid'
                });
            }


            var sale = new SaleModel();
            var post = new PostModel();

            // post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
    
            if (createdByType) {
                const duplicateTitle = await SaleModel.findOne({title: req.body.title});
                if (duplicateTitle) {
                    return res.json({
                        status: 0,
                        data: {},
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
            
            sale.areaData = area;
            sale.priceData = price;
            sale.area = postService.convertValueAreaToID(area);
            sale.price = postService.convertValueSalePriceToID(price, formality);
            
            sale.unit = unit;
            sale.address = address;

            sale.keywordList = keywordList;

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
            post.priority = priority.priority;
            post.from = from;
            post.to = to;
            post.formality = sale.formality;
            if (createdByType) {
                post.status = global.STATUS.ACTIVE;
            }else {
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
            }

            var url = urlSlug(title);
            let countDuplicate = await PostModel.countDocuments({url: url});
            if (countDuplicate > 0) url = url + "-" + countDuplicate;

            post.url = url;
            
            if (keywordList && keywordList.length > 0) {
                for (var i = 0; i < keywordList.length; i++) {
                    var key = keywordList[i];

                    var slug = urlSlug(key);

                    if (!slug) {
                        continue;
                    }

                    var tag = await TagModel.findOne({status: global.STATUS.ACTIVE, slug: slug});

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
            await checkUserPayment(user, post, dateCount * priority.costByDay);

            // notify
            const notifyParams = {
                fromUserId: null,
                toUserId: user._id,
                title: NotifyContent.PayPost.Title,
                content: NotifyContent.PayPost.Content,
                type: NotifyTypes.CHANGE_TRANSACTION,
                params: {
                    cost: dateCount * priority.costByDay
                }
            };
            NotifyController.createNotify(notifyParams);

            // send socket
            notifyParams.toUserIds = [notifyParams.toUserId];
            delete notifyParams.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, notifyParams);

            return res.json({
                status: HTTP_CODE.SUCCESS,
                data: post,
                message: 'request  post sale success !'
            });
        }
        catch (e) {
            return res.json({
                status: HTTP_CODE.ERROR,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    },

    upNew: async function (req, res, next) {
        try {
            let id = req.params.id;
            let post = await PostModel.findOne({_id: id});

            if (!post || post.postType != global.POST_TYPE_SALE) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: {},
                    message: 'post not exist '
                });
            }

            if (post.user != req.user._id.toString()) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: {},
                    message: 'user does not have permission !'
                });
            }

            let priority = await PostPriorityModel.findOne({priority: post.priority});
            let price = 0;
            let purchaseStatus = await UserModel.purchase(req.user._id, price);

            if (priority) {
                price = priority.costByDay;
            }

            if (!purchaseStatus) {
                return res.json({
                    status: HTTP_CODE.BAD_REQUEST,
                    data: {},
                    message: 'not enough money'
                });
            }

            post.refresh = Date.now();
            post.save();
            await TransactionHistoryModel.addTransaction(req.user._id, undefined, price, 'post : ' + post.title, post._id, global.TRANSACTION_TYPE_UP_NEW, purchaseStatus.before, purchaseStatus.after);

            // notify
            const notifyParams = {
                fromUserId: null,
                toUserId: req.user._id,
                title: NotifyContent.UpNew.Title,
                content: NotifyContent.UpNew.Content,
                type: NotifyTypes.CHANGE_TRANSACTION,
                params: {
                    price
                }
            };
            NotifyController.createNotify(notifyParams);

            // send socket
            notifyParams.toUserIds = [notifyParams.toUserId];
            delete notifyParams.toUserId;
            Socket.broadcast(SocketEvents.NOTIFY, notifyParams);


            return res.json({
                status: HTTP_CODE.SUCCESS,
                data: {},
                message: 'success !'
            });

        } catch (e) {
            return next(e);
        }
    },

    update: async function (req, res, next) {


        try {

            var token = req.headers.accesstoken;

            var accessToken = await  TokenModel.findOne({token: token});


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

            if (!post || post.postType != global.POST_TYPE_SALE) {
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


            var sale = await SaleModel.findOne({_id: post.contentId});


            if (!sale) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'sale not exist '
                });
            }


            var title = req.body.title;

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

            var keywordList = req.body.keywordList;

            var description = req.body.description;

            var streetWidth = req.body.streetWidth;
            var frontSize = req.body.frontSize;
            var direction = req.body.direction;
            var balconyDirection = req.body.balconyDirection;
            var floorCount = req.body.floorCount;
            var bedroomCount = req.body.bedroomCount;
            var toiletCount = req.body.toiletCount;
            var furniture = req.body.furniture;

            var images = req.body.images;
            ImageService.putUpdateImage(sale.images, images);

            var contactName = req.body.contactName;
            var contactAddress = req.body.contactAddress;
            var contactPhone = req.body.contactPhone;
            var contactMobile = req.body.contactMobile;
            var contactEmail = req.body.contactEmail;

            var priority = req.body.priority;

            var status = req.body.status;

            var from = req.body.from;
            var to = req.body.to;
    
    
            if (title && (sale.title != title)) {
                sale.title = title;
        
                var url = urlSlug(title);
        
                let countDuplicate = await PostModel.countDocuments({url: url});
                if (countDuplicate > 0) url = url + "-" + countDuplicate;
        
                post.url = url;
            }

            if (formality) {
                sale.formality = formality;
            }
            if (type) {
                sale.type = type;
            }
            if (city) {
                sale.city = city;
            }
            if (district) {
                sale.district = district;
            }
            if (ward) {
                sale.ward = ward;
            }
            if (street) {
                sale.street = street;
            }
            if (project) {
                sale.project = project;
            }
            if (area) {
                sale.areaData = area;
                sale.area = postService.convertValueAreaToID(area);
            }
            if (price) {
                sale.priceData = price;
                sale.price = postService.convertValueSalePriceToID(price, formality);
            }
            if (unit) {
                sale.unit = unit;
            }
            if (address) {
                sale.address = address;
            }

            if (keywordList) {
                sale.keywordList = keywordList;
            }

            if (description) {
                sale.description = description;
            }

            if (streetWidth) {
                sale.streetWidth = streetWidth;
            }
            if (frontSize) {
                sale.frontSize = frontSize;
            }
            if (direction) {
                sale.direction = direction;
            }
            if (balconyDirection) {
                sale.balconyDirection = balconyDirection;
            }
            if (floorCount) {
                sale.floorCount = floorCount;
            }
            if (bedroomCount) {
                sale.bedroomCount = bedroomCount;
            }
            if (toiletCount) {
                sale.toiletCount = toiletCount;
            }
            if (furniture) {
                sale.furniture = furniture;
            }

            if (images) {
                sale.images = images;
            }

            if (contactName) {
                sale.contactName = contactName;
            }
            if (contactAddress) {
                sale.contactAddress = contactAddress;
            }
            if (contactPhone) {
                sale.contactPhone = contactPhone;
            }
            if (contactMobile) {
                sale.contactMobile = contactMobile;
            }
            if (contactEmail) {
                sale.contactEmail = contactEmail;
            }
            if (status === global.STATUS.DELETE) {
                sale.status = status;
            }

            sale.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
            sale = await sale.save();

            post.type = sale.type;
            post.priority = sale.priority;

            if (from) {
                post.from = from;
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
                post.refresh = Date.now();

            }

            if (to) {
                post.to = to;
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
            }

            if (status == global.STATUS.DELETE) {
                post.status = status;
            }

            if (priority) {
                post.priority = priority;
                post.status = global.STATUS.PENDING_OR_WAIT_COMFIRM;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
            }


            if (keywordList && keywordList.length > 0) {
                for (var i = 0; i < keywordList.length; i++) {
                    var key = keywordList[i];

                    var slug = urlSlug(key);

                    if (!slug) {
                        continue;
                    }

                    var tag = await TagModel.findOne({status: global.STATUS.ACTIVE, slug: slug});

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
                data: sale,
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
};

module.exports = SaleController;
