var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var UrlParamModel = require('../models/UrlParamModel');
var urlSlug = require('url-slug');

var ProjectController = {




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

        var priority = req.body.priority;

        var from = req.body.from;
        var to = req.body.to;

        var captchaToken = req.body.captchaToken;

        try {
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

            var post = new PostModel();

            post.postType = global.POST_TYPE_SALE;
            post.type = sale.type;
            post.content_id = sale._id;
            post.priority = priority;
            post.from = from;
            post.to = to;
            post.formality = sale.formality;

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
                price: price
            });


            let mainUrl = !param ? global.PARAM_NOT_FOUND : param.param;

            post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();

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

}
module.exports = ProjectController
