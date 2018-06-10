var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');
var TokenModel = require('../models/TokenModel');
var _ = require('lodash');

var BuyController = {


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

            let buy =await BuyModel.findOne({_id : id});

            if(!buy)
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
                    id : buy._id,
                    title : buy.title,
                    description: buy.description,
                    keywordList : buy.keywordList,
                    formality : buy.formality,
                    type : buy.type,
                    city: buy.city,
                    district: buy.district,
                    ward : buy.ward,
                    street : buy.street,
                    project : buy.project,
                    areaMin : buy.areaMin,
                    areaMax : buy.areaMax,
                    priceMin : buy.priceMin,
                    priceMax : buy.priceMax,
                    unit : buy.unit,
                    address : buy.address,
                    images : buy.images,
                    contactName : buy.contactName,
                    contactAddress : buy.contactAddress,
                    contactPhone : buy.contactPhone,
                    contactMobile : buy.contactMobile,
                    contactEmail : buy.contactEmail,
                    receiveMail : buy.receiveMail,
                    date : buy.date
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
                type: global.POST_TYPE_BUY
                , to: {$gt: date}
                , from: {$lt: date}
            }).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await Promise.all(posts.map(async post => {


                let buy = await BuyModel.findOne({_id: post.content_id});


                return await {
                    id: post._id,
                    title: buy.title,
                    formality: buy.formality,
                    description: buy.description,
                    city: buy.city,
                    district: buy.district,
                    priceMin: buy.priceMin,
                    priceMax: buy.priceMax,
                    areaMin: buy.areaMin,
                    areaMax: buy.areaMax,
                    unit: buy.unit,
                    date: buy.date,
                    priority: post.priority,
                    images: buy.images,
                    address: buy.address,
                };


            }));


            let count = await PostModel.count({
                type: global.POST_TYPE_BUY
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


            var buy = new BuyModel();

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

            post.postType = global.POST_TYPE_BUY;
            post.formality = buy.formality;
            post.type = buy.type;
            post.content_id = buy._id;
            post.priority = 0;
            post.from = from;
            post.to = to;
            post.status = global.STATUS_POST_PENDING;
            post.payment = global.STATUS_POST_UNPAID;

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

}
module.exports = BuyController
