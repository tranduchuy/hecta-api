var PostModel = require('../../models/PostModel');
var BuyModel = require('../../models/BuyModel');
var TokenModel = require('../../models/TokenModel');
var TagModel = require('../../models/TagModel');
var _ = require('lodash');
var urlSlug = require('url-slug');
var UrlParamModel = require('../../models/UrlParamModel');
var UserModel = require('../../models/UserModel');

var BuyController = {
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

            var admin = await UserModel.findOne({
                _id: accessToken.user,
                status: global.STATUS_ACTIVE,
                role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
            });

            if (!admin) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin not found or blocked'
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

            var priority = req.body.priority;


            var status = req.body.status;

            var from = req.body.from;
            var to = req.body.to;

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
            if (status == global.STATUS_ACTIVE || status == global.STATUS_BLOCKED) {
                buy.status = status;
            }

            if (!buy.admin) {
                buy.admin = [];
            }

            buy.admin.push(accessToken.user);

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

                var paramX = await UrlParamModel.findOne({
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
                    extra: undefined,
                    text: undefined
                });

                var urlX = paramX ? paramX.param : global.PARAM_NOT_FOUND_BUY;

                var mainUrl = urlX + ((priceMax || priceMin) ? ('-gia' + (priceMin ? ('-tu-' + priceMin) : '') + (priceMax ? ('-den-' + priceMax) : '')) : '') + ((areaMax || areaMin) ? ('-dien-tich' + (areaMin ? ('-tu-' + areaMin) : '') + (areaMax ? ('-den-' + areaMax) : '')) : '');

                param = await UrlParamModel.findOne({param: mainUrl});
                while (param) {
                    mainUrl = mainUrl + '-';
                    param = await UrlParamModel.findOne({param: mainUrl});
                }

                param = new UrlParamModel({
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
                    areaMax: areaMax,
                    areaMin: areaMin,
                    area: undefined,
                    priceMax: priceMax,
                    priceMin: priceMin,
                    price: undefined,
                    param: mainUrl
                });

                param = await param.save();

            }

            mainUrl = param.param;

            post.url = mainUrl + '/' + urlSlug(buy.title) + '-' + Date.now();
            post.formality = buy.formality;
            post.type = buy.type;

            if (priority) {
                post.priority = priority;
            }

            if (from) {
                post.from = from;
                post.refresh = Date.now();
            }

            if (to) {
                post.to = to;
            }

            if (status != undefined) {
                post.status = status;
            }

            await post.save();

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
                            posts: []
                        });
                    }

                    tag.refresh = Date.now();
                    tag.posts.push(post._id);

                    await tag.save();
                })
            }


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
