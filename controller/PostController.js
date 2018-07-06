var SaleModel = require('../models/SaleModel');
var BuyModel = require('../models/BuyModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var urlSlug = require('url-slug');

var PostController = {


    listAdmin: async function (req, res, next) {

        var page = req.query.page;
        var priority = req.query.priority;
        var formality = req.query.formality;
        var postType = req.query.postType;
        var toDate = req.query.toDate;
        var fromDate = req.query.fromDate;
        var status = req.query.status;
        var id = req.query.id;


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

            var query = {};

            if (toDate && fromDate) {
                query.date = {
                    $gt: fromDate,
                    $lt: toDate
                };
            }

            if (id) {
                query._id = id;
            }


            if (priority != undefined) {
                query.priority = priority;
            }

            if (postType) {
                query.postType = postType;
            }

            if (formality) {
                query.formality = formality;
            }

            if (status != undefined) {
                query.status = status;
            }

            let posts = await PostModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


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

                                id: post._id,
                                url: post.url,
                                to: post.to,
                                from: post.from,
                                priority: post.priority,
                                postType: post.postType,
                                status: post.status,
                                paymentStatus: post.paymentStatus,
                                refresh: post.refresh
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
                            title: buy.title,
                            description: buy.description,
                            keywordList: keys,
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


                            id: post._id,
                            url: post.url,
                            to: post.to,
                            from: post.from,
                            priority: post.priority,
                            postType: post.postType,
                            status: post.status,
                            paymentStatus: post.paymentStatus,
                            refresh: post.refresh
                        };
                    }


                }
                ))
            ;


            let count = await
                PostModel.count(query);

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

        catch
            (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }


    },

    list: async function (req, res, next) {

        var page = req.query.page;
        var priority = req.query.priority;
        var formality = req.query.formality;
        var postType = req.query.postType;
        var toDate = req.query.toDate;
        var fromDate = req.query.fromDate;
        var status = req.query.status;
        var id = req.query.id;


        var token = req.headers.access_token;

        if (!token) {
            return res.json({
                status: 0,
                data: {},
                message: 'access token empty !'
            });
        }

        var accessToken = await  TokenModel.findOne({token: token});

        if (!accessToken) {
            return res.json({
                status: 0,
                data: {},
                message: 'access token invalid'
            });

        }


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

            var query = {user: accessToken.user};

            if (toDate && fromDate) {
                query.date = {
                    $gt: fromDate,
                    $lt: toDate
                };
            }

            if (id) {
                query._id = id;
            }


            if (priority != undefined) {
                query.priority = priority;
            }

            if (postType) {
                query.postType = postType;
            }

            if (formality) {
                query.formality = formality;
            }

            if (status != undefined) {
                query.status = status;
            }

            let posts = await PostModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await Promise.all(posts.map(async post => {


                if (post.postType == global.POST_TYPE_SALE) {

                    let sale = await SaleModel.findOne({_id: post.content_id});


                    return await
                        // {sale, post};
                        {

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
                            keywordList: sale.keywordList,
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

                            id: post._id,
                            url: post.url,
                            to: post.to,
                            from: post.from,
                            priority: post.priority,
                            postType: post.postType,
                            status: post.status,
                            paymentStatus: post.paymentStatus,
                            refresh: post.refresh
                        };
                }
                else {


                    let buy = await BuyModel.findOne({_id: post.content_id});


                    return await {

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

                        id: post._id,
                        url: post.url,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType,
                        status: post.status,
                        paymentStatus: post.paymentStatus,
                        refresh: post.refresh
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


    }
    ,

    detail: async function (req, res, next) {
        let id = req.params.id;

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

                let keys;

                if (!content.keywordList) {
                    keys = [];
                }
                else {
                    keys = await Promise.all(content.keywordList.map(async key => {

                            return {
                                keyword: key,
                                slug: urlSlug(key)
                            }
                        }
                    ));
                }

                return res.json({
                    status: 1,
                    data: {

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
                        keywordList: keys,
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

                        id: post._id,
                        url: post.url,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType,
                        status: post.status,
                        paymentStatus: post.paymentStatus,
                        refresh: post.refresh
                    },
                    message: 'request success'
                });
            }
            else {

                let keys;

                if (!content.keywordList) {
                    keys = [];
                }
                else {
                    keys = await Promise.all(content.keywordList.map(async key => {

                            return {
                                keyword: key,
                                slug: urlSlug(key)
                            }
                        }
                    ));
                }

                return res.json({
                    status: 1,
                    data: {

                        title: content.title,
                        description: content.description,
                        keywordList: keys,
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

                        id: post._id,
                        url: post.url,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType,
                        status: post.status,
                        paymentStatus: post.paymentStatus,
                        refresh: post.refresh

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
    ,


    detailAdmin: async function (req, res, next) {
        let id = req.params.id;

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

                        id: post._id,
                        url: post.url,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType,
                        status: post.status,
                        paymentStatus: post.paymentStatus,
                        refresh: post.refresh
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
