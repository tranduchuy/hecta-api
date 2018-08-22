var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');
var TokenModel = require('../models/TokenModel');
var TagModel = require('../models/TagModel');
var _ = require('lodash');
var urlSlug = require('url-slug');
var UrlParamModel = require('../models/UrlParamModel');
var PostPriorityModel = require('../models/PostPriorityModel');

var BuyController = {

    add: async function (req, res, next) {

        var token = req.headers.access_token;


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
        var areaMin = req.body.areaMin;
        var areaMax = req.body.areaMax;
        var priceMin = req.body.priceMin;
        var priceMax = req.body.priceMax;
        var unit = req.body.unit;

        var address = req.body.address;

        var images = req.body.images;

        var contactName = req.body.contactName;
        var contactAddress = req.body.contactAddress;
        var contactPhone = req.body.contactPhone;
        var contactMobile = req.body.contactMobile;
        var contactEmail = req.body.contactEmail;
        var receiveMail = req.body.receiveMail;

        var from = req.body.from;
        var to = req.body.to;

        var priorityId = req.body.priorityId;


        try {

            if (!priorityId || priorityId.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'priorityId : "' + priorityId + '" is invalid'
                });
            }

            var priority = await PostPriorityModel.findOne({_id: priorityId});

            if (!priority) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'priority not found'
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
            if (!from || from <= 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'from : "' + from + '" is invalid'
                });
            }
            if (!to || to <= from) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'to : "' + to + '" is invalid'
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


            var buy = new BuyModel();
            var post = new PostModel();

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
            buy.areaMin = areaMin;
            buy.areaMax = areaMax;
            buy.priceMin = priceMin;
            buy.priceMax = priceMax;
            buy.unit = unit;
            buy.address = address;

            buy.images = images;

            buy.contactName = contactName;
            buy.contactAddress = contactAddress;
            buy.contactPhone = contactPhone;
            buy.contactMobile = contactMobile;
            buy.contactEmail = contactEmail;
            buy.receiveMail = receiveMail;


            buy = await buy.save();

            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_BUY,

                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: undefined,
                bedroomCount: undefined,
                area: undefined,
                price: undefined,
                areaMax: areaMax,
                areaMin: areaMin,
                priceMax: priceMax,
                priceMin: priceMin,
                extra: undefined,
                text: undefined
            });


            if (!param) {
                param = new UrlParamModel({
                    postType: global.POST_TYPE_BUY,
                    param: 'bds-' + Date.now(),
                    formality: formality,
                    type: type,
                    city: city,
                    district: district,
                    ward: ward,
                    street: street,
                    project: project,
                    balconyDirection: undefined,
                    bedroomCount: undefined,
                    area: undefined,
                    price: undefined,
                    areaMax: areaMax,
                    areaMin: areaMin,
                    priceMax: priceMax,
                    priceMin: priceMin,
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


            post.postType = global.POST_TYPE_BUY;
            post.formality = buy.formality;
            post.type = buy.type;
            post.content_id = buy._id;
            post.priority = priority.priority;
            post.from = from;
            post.to = to;

            post.status = global.STATUS_POST_PENDING;
            post.paymentStatus = global.STATUS_PAYMENT_FREE;


            if (keywordList && keywordList.length > 0) {
                keywordList.forEach(async key => {

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
                    }

                    var tag = await TagModel.findOne({status: global.STATUS_ACTIVE, slug: slug});

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                        });
                        tag = await tag.save();

                    }
                    post.tags.push(tag._id);
                })
            }
            post = await post.save();


            return res.json({
                status: 1,
                data: post,
                message: 'request post buys success!'
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


            var buy = await BuyModel.findOne({_id: post.content_id});


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
            var areaMin = req.body.areaMin;
            var areaMax = req.body.areaMax;
            var priceMin = req.body.priceMin;
            var priceMax = req.body.priceMax;
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

            var priority = req.body.priority;


            if (title) {
                buy.title = title;
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
            if (areaMin) {
                buy.areaMin = areaMin;
            }
            if (areaMax) {
                buy.areaMax = areaMax;
            }
            if (priceMin) {
                buy.priceMin = priceMin;
            }
            if (priceMax) {
                buy.priceMax = priceMax;
            }
            if (unit) {
                buy.unit = unit;
            }

            if (address) {
                buy.address = address;
            }
            if (images) {
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

            if (status == global.STATUS_POST_DETELE) {
                buy.status = status;
            }

            buy = await buy.save();


            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_BUY,

                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: undefined,
                bedroomCount: undefined,
                area: undefined,
                price: undefined,
                areaMax: areaMax,
                areaMin: areaMin,
                priceMax: priceMax,
                priceMin: priceMin,
                extra: undefined,
                text: undefined
            });

            if (!param) {

                param = new UrlParamModel({
                    postType: global.POST_TYPE_BUY,

                    formality: formality,
                    type: type,
                    city: city,
                    district: district,
                    ward: ward,
                    param: 'bds-' + Date.now(),
                    street: street,
                    project: project,
                    balconyDirection: undefined,
                    bedroomCount: undefined,
                    area: undefined,
                    price: undefined,
                    areaMax: areaMax,
                    areaMin: areaMin,
                    priceMax: priceMax,
                    priceMin: priceMin,
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

            post.formality = buy.formality;
            post.type = buy.type;

            if (from) {
                post.from = from;
                post.status = global.STATUS_POST_PENDING;
                post.status = global.STATUS_PAYMENT_UNPAID;
                post.refresh = Date.now();
            }

            if (to) {
                post.to = to;
                post.status = global.STATUS_POST_PENDING;
                post.status = global.STATUS_PAYMENT_UNPAID;
            }

            if (status == global.STATUS_POST_DETELE) {
                post.status = status;
            }

            if (priority) {
                post.priority = priority;
                post.status = global.STATUS_POST_PENDING;
                post.status = global.STATUS_PAYMENT_UNPAID;
            }

            post.tags = [];


            if (keywordList && keywordList.length > 0) {
                keywordList.forEach(async key => {

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

                })
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
