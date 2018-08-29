var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');
var TagModel = require('../models/TagModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var AccountModel = require('../models/AccountModel');
var PostPriorityModel = require('../models/PostPriorityModel');
var ChildModel = require('../models/ChildModel');
var TransactionHistoryModel = require('../models/TransactionHistoryModel');
var UrlParamModel = require('../models/UrlParamModel');
var urlSlug = require('url-slug');
var SaleController = {


    add: async function (req, res, next) {

        var token = req.headers.access_token;


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

        var contactName = req.body.contactName;
        var contactAddress = req.body.contactAddress;
        var contactPhone = req.body.contactPhone;
        var contactMobile = req.body.contactMobile;
        var contactEmail = req.body.contactEmail;

        // var priority = req.body.priority;
        var priorityId = req.body.priorityId;

        var from = req.body.from;
        var to = req.body.to;

        var captchaToken = req.body.captchaToken;


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

            if (!description || description.length < 30 || description.length > 3000) {
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

            post.paymentStatus = global.STATUS.PAYMENT_UNPAID;


            if (token) {


                var accessToken = await  TokenModel.findOne({token: token});

                if (!accessToken) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'access token invalid'
                    });

                }

                post.user = accessToken.user;

                var price = priority.costByDay * dateCount;

                var child = await ChildModel.findOne({personalId: accessToken.user});
                var account = await AccountModel.findOne({owner: accessToken.user});

                var transaction = new TransactionHistoryModel({

                    userId: accessToken.user,
                    amount: price,
                    note: 'date : ' + Date.now(),
                    info: 'buy sale : ' + title,
                    type: global.TRANSACTION_TYPE_PAY_POST,

                    current: {
                        credit: child ? (child.credit - child.creditUsed) : 0,
                        main: account ? account.main : 0,
                        promo: account ? account.promo : 0
                    }
                });

                if (child) {
                    if (price <= child.credit) {
                        child.credit -= price;
                        price = 0;
                    }
                    else {
                        price -= child.credit;
                        child.creditUsed += child.credit;
                        child.credit = 0;

                    }
                }


                if (price <= account.promo) {
                    account.promo -= price;
                    price = 0;
                }
                else {
                    price -= account.promo;
                    account.promo = 0;
                }

                if (price <= account.main) {
                    account.main -= price;
                    price = 0;
                }
                else {
                    price -= account.main;
                    account.main = 0;
                }

                if (price == 0) {
                    post.paymentStatus = global.STATUS.PAYMENT_PAID;
                    await account.save();
                    await child.save();
                    await transaction.save();
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
            sale.area = area;
            sale.price = price;
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

            sale = await sale.save();


            post.postType = global.POST_TYPE_SALE;
            post.type = sale.type;
            post.content_id = sale._id;
            post.priority = priority.priority;
            post.from = from;
            post.to = to;
            post.formality = sale.formality;

            post.status = global.STATUS_PENDING;

            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_SALE,

                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                area: area,
                price: price,
                areaMax: undefined,
                areaMin: undefined,
                priceMax: undefined,
                priceMin: undefined,
                extra: undefined,
                text: undefined
            });


            if (!param) {
                param = new UrlParamModel({
                    postType: global.POST_TYPE_SALE,

                    formality: formality,
                    type: type,
                    city: city,
                    district: district,
                    ward: ward,
                    param: 'bds-' + Date.now(),
                    street: street,
                    project: project,
                    balconyDirection: balconyDirection,
                    bedroomCount: bedroomCount,
                    area: area,
                    price: price,
                    areaMax: undefined,
                    areaMin: undefined,
                    priceMax: undefined,
                    priceMin: undefined,
                    extra: undefined,
                    text: undefined
                });

                param = await param.save();

            }
            var url = urlSlug(title);

            var count = await PostModel.find({url: new RegExp("^" + url)});

            if (count > 0) {
                url += ('-' + count);
            }

            post.url = url;
            post.params = param._id;


            if (keywordList && keywordList.length > 0) {
                for (var i = 0; i < keywordList.length; i++) {
                    var key = keywordList[i];

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
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


            return res.json({
                status: 1,
                data: post,
                message: 'request  post sale success !'
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

    ,
    update: async function (req, res, next) {


        try {

            var token = req.headers.access_token;

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


            var sale = await SaleModel.findOne({_id: post.content_id});


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

            var contactName = req.body.contactName;
            var contactAddress = req.body.contactAddress;
            var contactPhone = req.body.contactPhone;
            var contactMobile = req.body.contactMobile;
            var contactEmail = req.body.contactEmail;

            var priority = req.body.priority;

            var status = req.body.status;

            var from = req.body.from;
            var to = req.body.to;


            if (title) {
                sale.title = title;
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
                sale.area = area;
            }
            if (price) {
                sale.price = price;
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
            if (status == global.STATUS.DELETE) {
                sale.status = status;
            }

            sale = await sale.save();


            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_SALE,

                formality: sale.formality,
                type: sale.type,
                city: sale.city,
                district: sale.district,
                ward: sale.ward,
                street: sale.street,
                project: sale.project,
                balconyDirection: sale.balconyDirection,
                bedroomCount: sale.bedroomCount,
                area: sale.area,
                price: sale.price,
                areaMax: undefined,
                areaMin: undefined,
                priceMax: undefined,
                priceMin: undefined,
                extra: undefined,
                text: undefined
            });


            if (!param) {

                param = new UrlParamModel({
                    postType: global.POST_TYPE_SALE,
                    formality: sale.formality,
                    type: sale.type,
                    city: sale.city,
                    param: 'bds-' + Date.now(),
                    district: sale.district,
                    ward: sale.ward,
                    street: sale.street,
                    project: sale.project,
                    balconyDirection: sale.balconyDirection,
                    bedroomCount: sale.bedroomCount,
                    area: sale.area,
                    price: sale.price,
                    areaMax: undefined,
                    areaMin: undefined,
                    priceMax: undefined,
                    priceMin: undefined,
                    extra: undefined,
                    text: undefined
                });

                param = await param.save();

            }

            if (title) {
                var url = urlSlug(title);

                var count = await PostModel.find({url: new RegExp("^" + url)});

                if (count > 0) {
                    url += ('-' + count);
                }

                post.url = url;
            }

            post.params = param._id;

            post.type = sale.type;
            post.priority = sale.priority;

            if (from) {
                post.from = from;
                post.status = global.STATUS_PENDING;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
                post.refresh = Date.now();

            }

            if (to) {
                post.to = to;
                post.status = global.STATUS_PENDING;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
            }

            if (status == global.STATUS.DELETE) {
                post.status = status;
            }

            if (priority) {
                post.priority = priority;
                post.status = global.STATUS_PENDING;
                post.paymentStatus = global.STATUS.PAYMENT_UNPAID;
            }


            if (keywordList && keywordList.length > 0) {
                for (var i = 0; i < keywordList.length; i++) {
                    var key = keywordList[i];

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
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
}
module.exports = SaleController
