var SaleModel = require('../models/SaleModel');
var BuyModel = require('../models/BuyModel');
var PostModel = require('../models/PostModel');
var TagModel = require('../models/TagModel');
var urlSlug = require('url-slug');

var _ = require('lodash');

var TagController = {


    list: async function (req, res, next) {

        // var slug = req.query.slug;
        var page = req.query.page;


        try {

            // if (slug) {
            //     return res.json({
            //         status: 0,
            //         data: {},
            //         message: 'slug : ' + slug + ' invalid'
            //     });
            // }

            if (!page || page < 1) {
                page = 1;
            }


            let tags = await TagModel.find().sort({refresh: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
            let count = await TagModel.count();

            return res.json({
                status: 1,
                data: {
                    items: tags,
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

    query: async function (req, res, next) {
        try {
            var page = req.query.page;
            var slug = req.query.slug;




            if (!slug || slug.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'slug : ' + slug + ' invalid'
                });
            }

            if (!page || page < 1) {
                page = 1;
            }

            var query = {slug: slug};


            let tag = await TagModel.findOne(query);

            if (!tag) {
                return res.json({
                    status: 1,
                    data: {
                        items: [],
                        page: page,
                        total: 0
                    },
                    message: 'request success '
                });
            }


            var posts = await PostModel.find({'_id': {$in: tag.posts.length > global.PAGE_SIZE ? tag.posts.slice(tag.posts.length - global.PAGE_SIZE) : tag.posts}});


            let results = await Promise.all(posts.map(async post => {


                if (post.postType == global.POST_TYPE_SALE) {

                    let sale = await SaleModel.findOne({_id: post.content_id});


                    let keys;

                    if (!sale.keywordList) {
                        keys = [];
                    }
                    else {
                        keys = await Promise.all(sale.keywordList.map(async key => {

                                return {
                                    keyword: key,
                                    slug: urlSlug(key)
                                }
                            }
                        ));
                    }

                    return await
                        // {sale, post};
                        {
                            postId: post._id,
                            url: post.url,
                            id: sale._id,
                            title: sale.title,
                            formality: sale.formality,
                            type: sale.type,
                            city: sale.city,
                            district: sale.district,
                            ward: sale.ward,
                            street: sale.street,
                            project: sale.project,
                            area: sale.area,
                            price: sale.price,
                            unit: sale.unit,
                            address: sale.address,
                            keywordList: keys,
                            description: sale.description,
                            streetWidth: sale.streetWidth,
                            frontSize: sale.frontSize,
                            direction: sale.direction,
                            balconyDirection: sale.balconyDirection,
                            floorCount: sale.floorCount,
                            bedroomCount: sale.bedroomCount,
                            toiletCount: sale.toiletCount,
                            furniture: sale.furniture,
                            images: sale.images,
                            contactName: sale.contactName,
                            contactAddress: sale.contactAddress,
                            contactPhone: sale.contactPhone,
                            contactMobile: sale.contactMobile,
                            contactEmail: sale.contactEmail,
                            date: sale.date,
                            to: post.to,
                            from: post.from,
                            status: post.status,
                            priority: post.priority,
                            postType: post.postType
                        };
                }
                else {


                    let buy = await BuyModel.findOne({_id: post.content_id});
                    let keys;

                    if (!buy.keywordList) {
                        keys = [];
                    }
                    else {
                        keys = await Promise.all(buy.keywordList.map(async key => {

                                return {
                                    keyword: key,
                                    slug: urlSlug(key)
                                }
                            }
                        ));
                    }

                    return await {
                        postId: post._id,
                        url: post.url,
                        id: buy._id,
                        title: buy.title,
                        description: buy.description,
                        keywordList: buy.keywordList,
                        formality: buy.formality,
                        type: buy.type,
                        city: buy.city,
                        district: buy.district,
                        ward: buy.ward,
                        street: buy.street,
                        project: buy.project,
                        areaMin: buy.areaMin,
                        areaMax: buy.areaMax,
                        priceMin: buy.priceMin,
                        priceMax: buy.priceMax,
                        unit: buy.unit,
                        address: buy.address,
                        images: buy.images,
                        contactName: buy.contactName,
                        contactAddress: buy.contactAddress,
                        contactPhone: buy.contactPhone,
                        contactMobile: buy.contactMobile,
                        contactEmail: buy.contactEmail,
                        receiveMail: buy.receiveMail,
                        date: buy.date,
                        to: post.to,
                        from: post.from,
                        status: post.status,
                        priority: post.priority,
                        postType: post.postType
                    };
                }


            }));


            let count = tag.posts.length;

            return res.json({
                status: 1,
                data: {
                    tag : tag,
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


    }


}
module.exports = TagController
