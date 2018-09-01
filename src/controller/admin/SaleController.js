var SaleModel = require('../../models/SaleModel');
var PostModel = require('../../models/PostModel');
var TagModel = require('../../models/TagModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var UrlParamModel = require('../../models/UrlParamModel');
var urlSlug = require('url-slug');
var UserModel = require('../../models/UserModel');


var SaleController = {


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
                status: global.STATUS.ACTIVE,
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

            if (!post || post.postType != global.POST_TYPE_SALE) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist '
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


            // var title = req.body.title;
            //
            // var formality = req.body.formality;
            // var type = req.body.type;
            // var city = req.body.city;
            // var district = req.body.district;
            // var ward = req.body.ward;
            // var street = req.body.street;
            // var project = req.body.project;
            // var area = req.body.area;
            // var price = req.body.price;
            // var unit = req.body.unit;
            // var address = req.body.address;
            //
            // var keywordList = req.body.keywordList;
            //
            // var description = req.body.description;
            //
            // var streetWidth = req.body.streetWidth;
            // var frontSize = req.body.frontSize;
            // var direction = req.body.direction;
            // var balconyDirection = req.body.balconyDirection;
            // var floorCount = req.body.floorCount;
            // var bedroomCount = req.body.bedroomCount;
            // var toiletCount = req.body.toiletCount;
            // var furniture = req.body.furniture;
            //
            // var images = req.body.images;
            //
            // var contactName = req.body.contactName;
            // var contactAddress = req.body.contactAddress;
            // var contactPhone = req.body.contactPhone;
            // var contactMobile = req.body.contactMobile;
            // var contactEmail = req.body.contactEmail;
            //
            // var priority = req.body.priority;

            var status = req.body.status;
            // var paymentStatus = req.body.paymentStatus;
            //
            //
            // var from = req.body.from;
            // var to = req.body.to;
            // var paymentStatus = req.body.paymentStatus;
            //
            //
            // if (title) {
            //     sale.title = title;
            // }
            //
            // if (formality) {
            //     sale.formality = formality;
            // }
            // if (type) {
            //     sale.type = type;
            // }
            // if (city) {
            //     sale.city = city;
            // }
            // if (district) {
            //     sale.district = district;
            // }
            // if (ward) {
            //     sale.ward = ward;
            // }
            // if (street) {
            //     sale.street = street;
            // }
            // if (project) {
            //     sale.project = project;
            // }
            // if (area) {
            //     sale.area = area;
            // }
            // if (price) {
            //     sale.price = price;
            // }
            // if (unit) {
            //     sale.unit = unit;
            // }
            // if (address) {
            //     sale.address = address;
            // }
            //
            // if (keywordList) {
            //     sale.keywordList = keywordList;
            // }
            //
            // if (description) {
            //     sale.description = description;
            // }
            //
            // if (streetWidth) {
            //     sale.streetWidth = streetWidth;
            // }
            // if (frontSize) {
            //     sale.frontSize = frontSize;
            // }
            // if (direction) {
            //     sale.direction = direction;
            // }
            // if (balconyDirection) {
            //     sale.balconyDirection = balconyDirection;
            // }
            // if (floorCount) {
            //     sale.floorCount = floorCount;
            // }
            // if (bedroomCount) {
            //     sale.bedroomCount = bedroomCount;
            // }
            // if (toiletCount) {
            //     sale.toiletCount = toiletCount;
            // }
            // if (furniture) {
            //     sale.furniture = furniture;
            // }
            //
            // if (images) {
            //     sale.images = images;
            // }
            //
            // if (contactName) {
            //     sale.contactName = contactName;
            // }
            // if (contactAddress) {
            //     sale.contactAddress = contactAddress;
            // }
            // if (contactPhone) {
            //     sale.contactPhone = contactPhone;
            // }
            // if (contactMobile) {
            //     sale.contactMobile = contactMobile;
            // }
            // if (contactEmail) {
            //     sale.contactEmail = contactEmail;
            // }

            if (status == global.STATUS.ACTIVE || status == global.STATUS.BLOCKED || status == global.STATUS.DELETE) {
                sale.status = status;
            }


            // if (priority) {
            //     sale.priority = priority;
            // }

            if (!sale.admin) {
                sale.admin = [];
            }

            sale.admin.push(accessToken.user);

            sale = await sale.save();


            // let param = await UrlParamModel.findOne({
            //     postType: global.POST_TYPE_SALE,
            //
            //     formality: formality,
            //     type: type,
            //     city: city,
            //     district: district,
            //     ward: ward,
            //     street: street,
            //     project: project,
            //     balconyDirection: balconyDirection,
            //     bedroomCount: bedroomCount,
            //     area: area,
            //     price: price,
            //     areaMax: undefined,
            //     areaMin: undefined,
            //     priceMax: undefined,
            //     priceMin: undefined,
            //     extra: undefined,
            //     text: undefined
            // });
            //
            //
            // if (!param) {
            //
            //     var mainUrl = global.PARAM_NOT_FOUND_SALE;
            //
            //     param = await UrlParamModel.findOne({param: mainUrl});
            //     while (param) {
            //         mainUrl = mainUrl + '-';
            //         param = await UrlParamModel.findOne({param: mainUrl});
            //     }
            //
            //     param = new UrlParamModel({
            //         postType: global.POST_TYPE_SALE,
            //
            //         formality: formality,
            //         type: type,
            //         city: city,
            //         district: district,
            //         ward: ward,
            //         street: street,
            //         project: project,
            //         balconyDirection: balconyDirection,
            //         bedroomCount: bedroomCount,
            //         area: area,
            //         price: price,
            //         areaMax: undefined,
            //         areaMin: undefined,
            //         priceMax: undefined,
            //         priceMin: undefined,
            //         extra: undefined,
            //         text: undefined,
            //         param: mainUrl
            //     });
            //
            //     param = await param.save();
            //
            // }
            //
            // mainUrl = param.param;
            // post.url = mainUrl + '/' + urlSlug(sale.title) + '-' + Date.now();

            // post.type = sale.type;
            // post.admin = accessToken.user;
            //
            // if (priority) {
            //     post.priority = priority;
            // }
            // if (paymentStatus == global.STATUS.PAYMENT_FREE || paymentStatus == global.STATUS.PAYMENT_PAID) {
            //     post.paymentStatus = paymentStatus;
            // }
            //
            // if (from) {
            //     post.from = from;
            //     post.refresh = Date.now();
            // }
            //
            // if (to) {
            //     post.to = to;
            // }

            if (status == global.STATUS.ACTIVE || status == global.STATUS.BLOCKED || status == global.STATUS.DELETE) {
                post.status = status;
            }


            await post.save();

            // if (keywordList && keywordList.length > 0) {
            //     keywordList.forEach(async key => {
            //
            //         var slug = urlSlug(key);
            //
            //         if (!slug) {
            //             return;
            //         }
            //
            //         var tag = await TagModel.findOne({slug: slug});
            //
            //         if (!tag) {
            //             tag = new TagModel({
            //                 slug: slug,
            //                 keyword: key,
            //                 posts: []
            //             });
            //         }
            //
            //         tag.refresh = Date.now();
            //         tag.posts.push(post._id);
            //
            //         await tag.save();
            //     })
            // }


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
