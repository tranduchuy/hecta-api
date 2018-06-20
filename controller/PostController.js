var SaleModel = require('../models/SaleModel');
var BuyModel = require('../models/BuyModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');

var PostController = {


    list: async function (req, res, next) {

        var page = req.query.page;
        var type = req.query.type;
        var formality = req.query.formality;
        var postType = req.query.postType;


        try {

            if (!postType || (postType != global.POST_TYPE_SALE && postType != global.POST_TYPE_BUY)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'postType : ' + postType + ' invalid'
                });
            }

            if (!page || page < 1) {
                page = 1;
            }

            let date = Date.now();

            var query = {
                postType: postType
                , to: {$gt: date}
                , from: {$lt: date}
            };

            if (type) {
                query.type = type;
            }

            if (formality) {
                query.formality = formality;
            }

            let posts = await PostModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await Promise.all(posts.map(async post => {


                if (postType == global.POST_TYPE_SALE) {

                    let sale = await SaleModel.findOne({_id: post.content_id});


                    return await
                        // {sale, post};
                        {
                            url: post.url,
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


                    let buy = await BuyModel.findOne({_id: post.content_id});


                    return await {
                        url: post.url,
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


            let count = await PostModel.count(query);

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

    detail: async function (req, res, next) {
        let id = req.params.id;

        console.log('id ', id);
        try {

            if (!id || id.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id null error'
                });

            }

            let post = await PostModel.findOne({_id: id});

            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist'
                });
            }

            let model = post.postType == global.POST_TYPE_SALE ? SaleModel : BuyModel;

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
                    status: 1,
                    data: {
                        url: post.url,
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
                    data: {
                        url: post.url,
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
module.exports = PostController
