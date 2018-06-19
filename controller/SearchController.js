var fs = require('fs');
var UrlParamModel = require('../models/UrlParamModel');
var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');
var SaleModel = require('../models/SaleModel');

var SearchController = {


    addParamUrl: async function (req, res, next) {
        try {
            var param = req.body.param;
            var postType = req.body.postType;
            var formality = req.body.formality;
            var type = req.body.type;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var street = req.body.street;
            var project = req.body.project;
            var balconyDirection = req.body.balconyDirection;
            var bedroomCount = req.body.bedroomCount;
            var area = req.body.area;
            var price = req.body.price;


            var urlParam = new UrlParamModel();

            urlParam.param = param;
            urlParam.postType = postType;
            urlParam.formality = formality;
            urlParam.type = type;
            urlParam.city = city;
            urlParam.district = district;
            urlParam.ward = ward;
            urlParam.street = street;
            urlParam.project = project;
            urlParam.balconyDirection = balconyDirection;
            urlParam.bedroomCount = bedroomCount;
            urlParam.area = area;
            urlParam.price = price;

            urlParam = await urlParam.save();

            return res.json({
                status: 1,
                data: urlParam,
                message: 'request success !'
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
    search: async function (req, res, next) {


        try {

            var url = req.query.url;
            var page = req.query.page;

            if (!page || page < 1) {
                page = 1;
            }

            if (!url || url.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid'
                });

            }


            var params = url.trim().split('/');

            if (params.length == 0 || params.length > 2) {

                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid'
                });
            }


            let cat = await await UrlParamModel.findOne({paramType: global.URL_PARAM_CAT, param: params[0]});


            if (!cat) {
                return res.json({
                    status: 0,
                    data: {},
                    message: params[0] + ' not found'
                });
            }

            let postType = cat.postType;

            let query = {};


            if (!cat.formality) {
                query.formality = formality;
            }
            if (!cat.type) {
                query.type = type;
            }
            if (!cat.city) {
                query.city = city;
            }
            if (!cat.district) {
                query.district = district;
            }
            if (!cat.ward) {
                query.ward = ward;
            }
            if (!cat.street) {
                query.street = street;
            }
            if (!cat.project) {
                query.project = project;
            }
            if (!cat.balconyDirection) {
                query.balconyDirection = balconyDirection;
            }
            if (!cat.bedroomCount) {
                query.bedroomCount = bedroomCount;
            }
            if (!cat.area) {
                query.area = area;
            }
            if (!cat.price) {
                query.price = price;
            }

            if (params.length == 1) {

                let model;

                switch (cat.postType) {
                    case global.POST_TYPE_SALE :
                        model = SaleModel;
                        break;
                    case global.POST_TYPE_BUY :
                        model = BuyModel;
                        break;
                    default :
                        model = SaleModel;
                        break;
                }

                let data = await model.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
                let results = await Promise.all(data.map(async post => {


                    if (postType == global.POST_TYPE_SALE) {

                        let sale = post;


                        return {
                            id: post._id,
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
                    }
                    else {


                        let buy = post;

                        return {
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
                    }


                }));


                let count = await model.count(query);

                return res.json({
                    status: 1,
                    type: postType,
                    isList: true,
                    params: query,
                    data: {
                        items: results,
                        page: page,
                        total: _.ceil(count / global.PAGE_SIZE)
                    },
                    message: 'request success '
                });


            }

            // let detail = await UrlParamModel.findOne({
            //     paramType: global.URL_PARAM_DETAIL,
            //     param: params[1],
            //     parent: cat._id
            // });


            let post = await PostModel.findOne({param: params[1]});
            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist'
                });
            }

            let model;

            switch (cat.postType) {
                case global.POST_TYPE_SALE :
                    model = SaleModel;
                    break;
                case global.POST_TYPE_BUY :
                    model = BuyModel;
                    break;
                default :
                    model = SaleModel;
                    break;
            }

            let content = await model.findOne({_id: post.content_id});


            if (!content) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });


            }

            if (post.postType == global.POST_TYPE_SALE) {

                return res.json({
                    type: postType,
                    isList: false,
                    params: query,
                    status: 1,
                    data: {
                        id: content._id,
                        title: content.title,
                        formality: content.formality,
                        type: content.type,
                        city: content.city,
                        district: content.district,
                        ward: content.ward,
                        street: content.street,
                        project: content.project,
                        area: content.area,
                        price: content.price,
                        unit: content.unit,
                        address: content.address,
                        keywordList: content.keywordList,
                        description: content.description,
                        streetWidth: content.streetWidth,
                        frontSize: content.frontSize,
                        direction: content.direction,
                        balconyDirection: content.balconyDirection,
                        floorCount: content.floorCount,
                        bedroomCount: content.bedroomCount,
                        toiletCount: content.toiletCount,
                        furniture: content.furniture,
                        images: content.images,
                        contactName: content.contactName,
                        contactAddress: content.contactAddress,
                        contactPhone: content.contactPhone,
                        contactMobile: content.contactMobile,
                        contactEmail: content.contactEmail,
                        date: content.date,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType
                    },
                    message: 'request success'
                });
            }
            else {

                return res.json({
                    status: 1,
                    type: postType,
                    isList: false,
                    params: query,
                    data: {
                        id: content._id,
                        title: content.title,
                        description: content.description,
                        keywordList: content.keywordList,
                        formality: content.formality,
                        type: content.type,
                        city: content.city,
                        district: content.district,
                        ward: content.ward,
                        street: content.street,
                        project: content.project,
                        areaMin: content.areaMin,
                        areaMax: content.areaMax,
                        priceMin: content.priceMin,
                        priceMax: content.priceMax,
                        unit: content.unit,
                        address: content.address,
                        images: content.images,
                        contactName: content.contactName,
                        contactAddress: content.contactAddress,
                        contactPhone: content.contactPhone,
                        contactMobile: content.contactMobile,
                        contactEmail: content.contactEmail,
                        receiveMail: content.receiveMail,
                        date: content.date,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType
                    },
                    message: 'request success'
                });
            }

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
module.exports = SearchController
