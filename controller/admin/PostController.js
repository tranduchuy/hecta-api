var SaleModel = require('../../models/SaleModel');
var BuyModel = require('../../models/BuyModel');
var PostModel = require('../../models/PostModel');
var NewsModel = require('../../models/NewsModel');
var ProjectModel = require('../../models/ProjectModel');
var _ = require('lodash');
var urlSlug = require('url-slug');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');

var PostController = {

    updateUrl: async function (req, res, next) {

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
                message: 'id null error'
            });

        }

        var post = await PostModel.findOne({_id: id});

        if (!post) {
            return res.json({
                status: 0,
                data: {},
                message: 'post not exist'
            });
        }

        let url = req.body.url;

        let metaTitle = req.body.metaTitle;
        let metaDescription = req.body.metaDescription;
        let metaType = req.body.metaType;
        let metaUrl = req.body.metaUrl;
        let metaImage = req.body.metaImage;
        let canonical = req.body.canonical;
        let textEndPage = req.body.textEndPage;

        if (url && url.length > 0) {
            if (await PostModel.count({url: url, _id: {$ne: id}}) > 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'url duplicate '
                });
            }

            post.url = url;
        }

        if (metaTitle) {
            post.metaTitle = metaTitle;
        }

        if (metaDescription) {
            post.metaDescription = metaDescription;
        }

        if (metaType) {
            post.metaType = metaType;
        }

        if (metaUrl) {
            post.metaUrl = metaUrl;
        }

        if (metaImage) {
            post.metaImage = metaImage;
        }

        if (canonical) {
            post.canonical = canonical;
        }

        if (textEndPage) {
            post.textEndPage = textEndPage;
        }

        post = await post.save();


        return res.json({
            status: 1,
            data: post,
            message: 'success !'
        });


    },

    list: async function (req, res, next) {


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


            var page = req.query.page;
            var priority = req.query.priority;
            var formality = req.query.formality;
            var postType = req.query.postType;
            var toDate = req.query.toDate;
            var fromDate = req.query.fromDate;
            var status = req.query.status;
            var id = req.query.id;

            if (!postType || (postType != global.POST_TYPE_SALE && postType != global.POST_TYPE_BUY && postType != global.POST_TYPE_NEWS && postType != global.POST_TYPE_PROJECT)) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'postType : ' + postType + ' invalid'
                });
            }

            if (!page || page < 1) {
                page = 1;
            }

            var query;
            if (status == global.STATUS.ACTIVE || status == global.STATUS.BLOCKED) {
                query = {status: status};
            }
            else {
                query = {status: {$ne: global.STATUS.DELETE}};
            }

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

            let posts = await
                PostModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await
                Promise.all(posts.map(async post => {


                        if (post.postType == global.POST_TYPE_SALE) {

                            let sale = await SaleModel.findOne({_id: post.content_id});
                            if (!sale) {
                                sale = {};
                            }
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
                                    refresh: post.refresh,

                                    metaTitle: post.metaTitle,
                                    metaDescription: post.metaDescription,
                                    metaType: post.metaType,
                                    metaUrl: post.metaUrl,
                                    metaImage: post.metaImage,
                                    canonical: post.canonical,
                                    textEndPage: post.textEndPage,
                                };
                        }

                        if (post.postType == global.POST_TYPE_BUY) {

                            let buy = await BuyModel.findOne({_id: post.content_id});
                            if (!buy) {
                                buy = {};
                            }
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

                        if (post.postType == global.POST_TYPE_NEWS) {

                            let news = await NewsModel.findOne({_id: post.content_id});

                            if (!news) {
                                news = {};
                            }

                            return {

                                status: news.status,
                                title: news.title,
                                content: news.content,
                                cate: news.type,
                                image: news.image,
                                date: news.date,
                                description: news.description,
                                id: post._id,
                                url: post.url,
                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage
                            }


                        }
                        if (post.postType == global.POST_TYPE_PROJECT) {

                            let project = await ProjectModel.findOne({_id: post.content_id});

                            if (!project) {
                                project = {};
                            }
                            return {

                                status: project.status,
                                isShowOverview: project.isShowOverview,
                                type: project.type,
                                introImages: project.introImages,
                                title: project.title,
                                address: project.address,
                                area: project.area,
                                projectScale: project.projectScale,
                                price: project.price,
                                deliveryHouseDate: project.deliveryHouseDate,
                                constructionArea: project.constructionArea,
                                descriptionInvestor: project.descriptionInvestor,
                                description: project.description,

                                isShowLocationAndDesign: project.isShowLocationAndDesign,
                                location: project.location,
                                infrastructure: project.infrastructure,

                                isShowGround: project.isShowGround,
                                overallSchema: project.overallSchema,
                                groundImages: project.groundImages,

                                isShowImageLibs: project.isShowImageLibs,
                                imageAlbums: project.imageAlbums,

                                isShowProjectProgress: project.isShowProjectProgress,
                                projectProgressTitle: project.projectProgressTitle,
                                projectProgressStartDate: project.projectProgressStartDate,
                                projectProgressEndDate: project.projectProgressEndDate,
                                projectProgressDate: project.projectProgressDate,
                                projectProgressImages: project.projectProgressImages,

                                isShowTabVideo: project.isShowTabVideo,
                                video: project.video,

                                isShowFinancialSupport: project.isShowFinancialSupport,
                                financialSupport: project.financialSupport,

                                isShowInvestor: project.isShowInvestor,
                                detailInvestor: project.detailInvestor,

                                district: project.district,
                                city: project.city,

                                id: post._id,
                                url: post.url,
                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage,


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


    }

    ,


    detail: async function (req, res, next) {

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
                    message: 'id null error'
                });

            }

            let post = await PostModel.findOne({_id: id, status: {$ne: global.STATUS.DELETE}});

            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist'
                });
            }

            let model = BuyModel;//post.postType == global.POST_TYPE_SALE ? SaleModel : BuyModel;

            switch (post.postType) {
                case global.POST_TYPE_SALE:
                    model = SaleModel;
                    break;
                case global.POST_TYPE_BUY:
                    model = BuyModel;
                    break;
                case global.POST_TYPE_NEWS:
                    model = NewsModel;
                    break;
                case global.POST_TYPE_PROJECT:
                    model = ProjectModel;
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

                        id: post._id,
                        url: post.url,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType,
                        status: post.status,
                        paymentStatus: post.paymentStatus,
                        refresh: post.refresh,

                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                    },
                    message: 'request success'
                });
            }
            if (post.postType == global.POST_TYPE_BUY) {

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
                        refresh: post.refresh,

                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                    },
                    message: 'request success'
                });
            }
            if (post.postType == global.POST_TYPE_NEWS) {

                return res.json({
                    status: 1,
                    data: {
                        id: post._id,
                        title: content.title,
                        content: content.content,
                        cate: content.type,
                        image: content.image,
                        description: content.description,
                        date: content.date,


                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                        url: post.url
                    },
                    message: 'request success'
                });
            }
            if (post.postType == global.POST_TYPE_PROJECT) {

                return res.json({
                    status: 1,
                    data: {
                        isShowOvervjiew: content.isShowOverview,
                        type: content.type,
                        introImages: content.introImages,
                        title: content.title,
                        address: content.address,
                        area: content.area,
                        projectScale: content.projectScale,
                        price: content.price,
                        deliveryHouseDate: content.deliveryHouseDate,
                        constructionArea: content.constructionArea,
                        descriptionInvestor: content.descriptionInvestor,
                        description: content.description,

                        isShowLocationAndDesign: content.isShowLocationAndDesign,
                        location: content.location,
                        infrastructure: content.infrastructure,

                        isShowGround: content.isShowGround,
                        overallSchema: content.overallSchema,
                        groundImages: content.groundImages,

                        isShowImageLibs: content.isShowImageLibs,
                        imageAlbums: content.imageAlbums,

                        isShowProjectProgress: content.isShowProjectProgress,
                        projectProgressTitle: content.projectProgressTitle,
                        projectProgressStartDate: content.projectProgressStartDate,
                        projectProgressEndDate: content.projectProgressEndDate,
                        projectProgressDate: content.projectProgressDate,
                        projectProgressImages: content.projectProgressImages,

                        isShowTabVideo: content.isShowTabVideo,
                        video: content.video,

                        isShowFinancialSupport: content.isShowFinancialSupport,
                        financialSupport: content.financialSupport,

                        isShowInvestor: content.isShowInvestor,
                        detailInvestor: content.detailInvestor,

                        district: content.district,
                        city: content.city,

                        status: content.status,

                        id: post._id,
                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                        url: post.url
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
