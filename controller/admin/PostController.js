const SaleModel = require('../../models/SaleModel');
const BuyModel = require('../../models/BuyModel');
const PostModel = require('../../models/PostModel');
const NewsModel = require('../../models/NewsModel');
const ProjectModel = require('../../models/ProjectModel');
const _ = require('lodash');
const urlSlug = require('url-slug');
const HttpCode = require('../../config/http-code');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const PostService = require('../../services/PostService');
const RoleService = require('../../services/RoleService');

const PostController = {
    updateUrl: async function (req, res, next) {
        const admin = req.user;

        if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
            logger.error('PostController::updateUrl::error. Permission denied');
            return next(new Error('Permission denied'));
        }

        let id = req.params.id;

        if (!id) {
            logger.error('PostController::updateUrl::error. Id is required');
            return next(new Error('Id is required'));
        }

        const post = await PostModel.findOne({_id: id});
        if (!post) {
            logger.error('PostController::updateUrl::error. Post not found');
            return next(new Error('Post not found'));
        }

        const properties = ['metaTitle', 'metaDescription', 'metaType', 'metaUrl', 'metaImage', 'canonical', 'textEndPage'];
        let customUrl = req.body.url;

        if (customUrl && customUrl !== post.customUrl) {
            const queryCountDuplicate = {
                _id: {$ne: id},
                $or: [
                    {url: customUrl},
                    {customUrl}
                ]
            };

            if (await PostModel.countDocuments(queryCountDuplicate) > 0) {
                logger.error('PostController::updateUrl::error. Duplicate url or customUrl', customUrl);
                return next(new Error('Duplicate url or customUrl. Url: ' + customUrl))
            }

            // post.url = url; // url property should not be changed, it is original
            post.customUrl = customUrl;
        }

        properties.forEach(p => {
            if (req.body[p]) {
                post[p] = req.body[p];
            }
        });

        await post.save();

        return res.json({
            status: HttpCode.SUCCESS,
            data: post,
            message: 'Success'
        });
    },

    list2: async (req, res, next) => {
        logger.info('Admin/PostController::list2 is called');

        try {
            if (!RoleService.isAdmin(req.user)) {
                return next(new Error('Permission denied'));
            }

            let {postType} = req.query;

            if (postType === undefined) {
                logger.error('Admin/PostController::list2::error. Invalid postType');
                return next(new Error('Invalid postType'));
            }

            postType = parseInt(postType, 0);

            let stages = [];
            switch (postType) {
                case global.POST_TYPE_SALE:
                    stages = PostService.generateStageQueryPostSale(req);
                    break;
                case global.POST_TYPE_BUY:
                    stages = PostService.generateStageQueryPostBuy(req);
                    break;
                case global.POST_TYPE_PROJECT:
                    stages = PostService.generateStageQueryPostProject(req);
                    break;
                case global.POST_TYPE_NEWS:
                    stages = PostService.generateStageQueryPostNews(req);
                    break;
            }

            logger.info('Admin/PostController::list2. Aggregate stages: ', JSON.stringify(stages));

            const results = await PostModel.aggregate(stages);
            return res.json({
                status: HttpCode.SUCCESS,
                data: {
                    entries: results[0].entries,
                    meta: {
                        totalItems: results[0].entries.length > 0 ? results[0].meta[0].totalItems : 0
                    }
                },
                message: 'Success'
            });
        } catch (e) {
            logger.error('Admin/PostController::list2::error', e);
            return next(e);
        }
    },

    list: async function (req, res, next) {
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
                return res.json({
                    status: HttpCode.ERROR,
                    data: {},
                    message: 'Permission denied'
                });
            }

            let {page, priority, formality, postType, toDate, fromDate, status, id} = req.query;

            if (!postType || (postType != global.POST_TYPE_SALE && postType != global.POST_TYPE_BUY && postType != global.POST_TYPE_NEWS && postType != global.POST_TYPE_PROJECT)) {
                return res.json({
                    status: HttpCode.ERROR,
                    data: {},
                    message: 'Invalid PostType: ' + postType
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

                            let sale = await SaleModel.findOne({_id: post.contentId});
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

                            let buy = await BuyModel.findOne({_id: post.contentId});
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

                            let news = await NewsModel.findOne({_id: post.contentId});

                            if (!news) {
                                news = {};
                            }

                            return {
                                createdByType: news.createdByType,
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

                            let project = await ProjectModel.findOne({_id: post.contentId});

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


    },

    detail: async function (req, res, next) {
        logger.info('PostController::detail is called');
        try {
            const admin = req.user;

            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
                logger.error('PostController::updateUrl::error. Permission denied');
                return next(new Error('Permission denied'));
            }

            let id = req.params.id;

            if (!id) {
                return next(new Error('Post id is required'));
            }

            let post = await PostModel.findOne({_id: id});

            if (!post) {
                logger.error('PostController::detail::error. Post not found', id);
                return next(new Error('Post not found'));
            } else if (post.status === global.STATUS.DELETE) {
                logger.error('PostController::detail::error. Post is deleted', id);
                return next(new Error('Post is deleted'));
            }

            let model = SaleModel;
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

            let content = await model.findOne({_id: post.contentId});
            if (!content) {
                logger.error('PostController::detail::error. ContentId not found detail', post.contentId);
                return next(new Error('ContentId not found detail: ' + post.contentId));
            }

            return res.json({
                status: HttpCode.SUCCESS,
                data: Object.assign({}, post.toObject(), content.toObject(), {id: post._id}),
                message: 'Success'
            });

            // if (post.postType == global.POST_TYPE_SALE) {
            //
            //     return res.json({
            //         status: 1,
            //         data: {
            //
            //             title: content.title,
            //             formality: content.formality,
            //             type: content.type,
            //             city: content.city,
            //             district: content.district,
            //             ward: content.ward,
            //             street: content.street,
            //             project: content.project,
            //             area: content.area,
            //             price: content.price,
            //             unit: content.unit,
            //             address: content.address,
            //             keywordList: content.keywordList,
            //             description: content.description,
            //             streetWidth: content.streetWidth,
            //             frontSize: content.frontSize,
            //             direction: content.direction,
            //             balconyDirection: content.balconyDirection,
            //             floorCount: content.floorCount,
            //             bedroomCount: content.bedroomCount,
            //             toiletCount: content.toiletCount,
            //             furniture: content.furniture,
            //             images: content.images,
            //             contactName: content.contactName,
            //             contactAddress: content.contactAddress,
            //             contactPhone: content.contactPhone,
            //             contactMobile: content.contactMobile,
            //             contactEmail: content.contactEmail,
            //             date: content.date,
            //
            //             id: post._id,
            //             url: post.url,
            //             customUrl: post.customUrl,
            //             to: post.to,
            //             from: post.from,
            //             priority: post.priority,
            //             postType: post.postType,
            //             status: post.status,
            //             paymentStatus: post.paymentStatus,
            //             refresh: post.refresh,
            //
            //             metaTitle: post.metaTitle,
            //             metaDescription: post.metaDescription,
            //             metaType: post.metaType,
            //             metaUrl: post.metaUrl,
            //             metaImage: post.metaImage,
            //             canonical: post.canonical,
            //             textEndPage: post.textEndPage,
            //         },
            //         message: 'request success'
            //     });
            // }
            // if (post.postType == global.POST_TYPE_BUY) {
            //
            //     return res.json({
            //         status: 1,
            //         data: {
            //             title: content.title,
            //             description: content.description,
            //             keywordList: content.keywordList,
            //             formality: content.formality,
            //             type: content.type,
            //             city: content.city,
            //             district: content.district,
            //             ward: content.ward,
            //             street: content.street,
            //             project: content.project,
            //             areaMin: content.areaMin,
            //             areaMax: content.areaMax,
            //             priceMin: content.priceMin,
            //             priceMax: content.priceMax,
            //             unit: content.unit,
            //             address: content.address,
            //             images: content.images,
            //             contactName: content.contactName,
            //             contactAddress: content.contactAddress,
            //             contactPhone: content.contactPhone,
            //             contactMobile: content.contactMobile,
            //             contactEmail: content.contactEmail,
            //             receiveMail: content.receiveMail,
            //             date: content.date,
            //
            //             id: post._id,
            //             url: post.url,
            //             customUrl: post.customUrl,
            //             to: post.to,
            //             from: post.from,
            //             priority: post.priority,
            //             postType: post.postType,
            //             status: post.status,
            //             paymentStatus: post.paymentStatus,
            //             refresh: post.refresh,
            //
            //             metaTitle: post.metaTitle,
            //             metaDescription: post.metaDescription,
            //             metaType: post.metaType,
            //             metaUrl: post.metaUrl,
            //             metaImage: post.metaImage,
            //             canonical: post.canonical,
            //             textEndPage: post.textEndPage,
            //         },
            //         message: 'request success'
            //     });
            // }
            // if (post.postType == global.POST_TYPE_NEWS) {
            //
            //     return res.json({
            //         status: 1,
            //         data: {
            //             id: post._id,
            //             title: content.title,
            //             content: content.content,
            //             cate: content.type,
            //             image: content.image,
            //             description: content.description,
            //             date: content.date,
            //
            //
            //             metaTitle: post.metaTitle,
            //             metaDescription: post.metaDescription,
            //             metaType: post.metaType,
            //             metaUrl: post.metaUrl,
            //             metaImage: post.metaImage,
            //             canonical: post.canonical,
            //             textEndPage: post.textEndPage,
            //             url: post.customUrl || post.url
            //         },
            //         message: 'request success'
            //     });
            // }
            // if (post.postType == global.POST_TYPE_PROJECT) {
            //     return res.json({
            //         status: HttpCode.SUCCESS,
            //         data: Object.assign({}, content.toObject(), post.toObject(), {id: post._id}),
            //         message: 'Success'
            //     });
            // }
        } catch (e) {
            logger.error('PostController::detail::error', e);
            return next(e);
        }
    }
};

module.exports = PostController;
