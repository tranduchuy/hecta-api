var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');

var SaleController = {


    detail: async function (req, res, next) {
        let id = req.params.id;
        try {

            if(!id || id.length == 0)
            {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id null error'
                });

            }

            let sale =await SaleModel.findOne({_id : id});

            if(!sale)
            {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });
            }



            return res.json({
                status: 1,
                data: {
                    id : sale._id,
                    title : sale.title,
                    formality : sale.formality,
                    type : sale.type,
                    city : sale.city,
                    district : sale.district,
                    ward : sale.ward,
                    street : sale.street,
                    project : sale.project,
                    area : sale.area,
                    price : sale.price,
                    unit : sale.unit,
                    address : sale.address,
                    keywordList : sale.keywordList,
                    description : sale.description,
                    streetWidth : sale.streetWidth,
                    frontSize : sale.frontSize,
                    direction : sale.direction,
                    balconyDirection : sale.balconyDirection,
                    floorCount : sale.floorCount,
                    bedroomCount : sale.bedroomCount,
                    toiletCount : sale.toiletCount,
                    furniture : sale.furniture,
                    images : sale.images,
                    contactName : sale.contactName,
                    contactAddress : sale.contactAddress,
                    contactPhone : sale.contactPhone,
                    contactMobile : sale.contactMobile,
                    contactEmail : sale.contactEmail,
                    date : sale.date
                },
                message: 'request success'
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
    list: async function (req, res, next) {

        var page = req.query.page;

        if (!page || page < 1) {
            page = 1;
        }

        try {

            let date = Date.now();

            let posts = await PostModel.find({
                type: global.POST_TYPE_SALE
                , to: {$gt: date}
                , from: {$lt: date}
            }).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await Promise.all(posts.map(async post => {


                let sale = await SaleModel.findOne({_id: post.content_id});


                return await
                    // {sale, post};
                    {
                    id: sale._id,
                    formality: sale.formality,
                    title: sale.title,
                    description: sale.description,
                    city: sale.city,
                    district: sale.district,
                    price: sale.price,
                    unit: sale.unit,
                    area: sale.area,
                    date: sale.date,
                    priority: post.priority,
                    images: sale.images,
                    address: sale.address,
                };


            }));


            let count = await PostModel.count({
                type: global.POST_TYPE_SALE
                , to: {$gt: date}
                , from: {$lt: date}
            });

            return res.json({
                status: 1,
                data: {
                    items: results,
                    page: page,
                    total: _.ceil(count / global.PAGE_SIZE)
                },
                message: 'request success '
            });


        }

        catch (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }


    },

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

            post.type = global.POST_TYPE_SALE;
            post.content_id = sale._id;
            post.priority = priority;
            post.from = from;
            post.to = to;

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
module.exports = SaleController
