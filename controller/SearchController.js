const _ = require('lodash');
const UrlParamModel = require('../models/UrlParamModel');
const PostModel = require('../models/PostModel');
const BuyModel = require('../models/BuyModel');
const SaleModel = require('../models/SaleModel');
const NewsModel = require('../models/NewsModel');
const ProjectModel = require('../models/ProjectModel');
const urlSlug = require('url-slug');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const HttpCode = require('../config/http-code');

/**
 * Get model type by cat.postType
 * @param cat UrlParamModel
 */
const getModelByCatPostType = (cat) => {
    switch (cat.postType) {
        case global.POST_TYPE_SALE:
            return SaleModel;
        case global.POST_TYPE_BUY:
            return BuyModel;
        case global.POST_TYPE_PROJECT:
            return ProjectModel;
        case global.POST_TYPE_NEWS:
            return NewsModel;
        default:
            return SaleModel;
    }
};

const isValidSlugSearch = (slug) => {
    return slug === global.SLUG_NEWS ||
        slug === global.SLUG_PROJECT ||
        slug === global.SLUG_SELL_OR_BUY;
};

const isValidSlugCategorySearch = (slug) => {
    return slug === global.SLUG_CATEGORY_SELL_OR_BUY ||
        slug === global.SLUG_CATEGORY_NEWS ||
        slug === global.SLUG_CATEGORY_PROJECT;
};

const mapCategoryToQuery = (catObj, query, additionalProperties = []) => {
    if (!catObj) {
        return;
    }

    const catProperties = [
        ...additionalProperties, 'formality', 'type', 'city', 'district',
        'ward', 'street', 'project', 'balconyDirection',
        'bedroomCount', 'areaMax', 'areaMin', 'area',
        'priceMax', 'priceMin', 'price'
    ];

    catProperties.forEach(field => {
        if (catObj[field]) {
            query[field] = catObj[field];
        }
    });
};

const handleSearchCaseNotCategory = async (res, param, slug) => {
    let data = {};
    let post = await PostModel.findOne({
        status: global.STATUS.ACTIVE,
        $or: [
            {url: param},
            {customUrl: param}
        ]
    });

    if (!post) {
        logger.error('SearchController::search::error Post not found');
        return next(new Error('Post not found'));
    }

    let cat = await UrlParamModel.findOne({_id: post.params});
    let query = {status: global.STATUS.ACTIVE};
    mapCategoryToQuery(cat, query, ['postType']);

    query._id = {$ne: post._id};

    let related = await PostModel.find(query).limit(10);

    if (slug == global.SLUG_NEWS) {


        if (post.postType != global.POST_TYPE_NEWS) {
            return res.json({
                status: 0,
                data: {},
                message: 'post of news not found 1'
            });
        }

        let news = await NewsModel.findOne({
            _id: post.contentId
        });

        if (!news) {
            return res.json({
                status: 0,
                data: {},
                message: 'news not found'
            });
        }


        data = {
            title: news.title,
            content: news.content,
            cate: news.type,
            image: news.image,
            description: news.description,
            date: news.date,
            createdByType: news.createdByType ? news.createdByType : null,

            id: post._id,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            metaType: post.metaType,
            metaUrl: post.metaUrl,
            metaImage: post.metaImage,
            canonical: post.canonical,
            textEndPage: post.textEndPage,
            url: post.url
        };


    }

    if (slug == global.SLUG_PROJECT) {


        if (post.postType != global.POST_TYPE_PROJECT) {
            return res.json({
                status: 0,
                data: {},
                message: 'post of project not found 1'
            });
        }

        let project = await ProjectModel.findOne({
            _id: post.contentId
        });

        if (!project) {
            return res.json({
                status: 0,
                data: {},
                message: 'project not found'
            });
        }


        data = {
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

            status: project.status,

            createdByType: project.createdByType ? project.createdByType : null,

            id: post._id,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            metaType: post.metaType,
            metaUrl: post.metaUrl,
            metaImage: post.metaImage,
            canonical: post.canonical,
            textEndPage: post.textEndPage,
            url: post.url
        }

    }

    if (slug == global.SLUG_SELL_OR_BUY) {


        if (post.postType != global.POST_TYPE_BUY && post.postType != global.POST_TYPE_SALE) {
            return res.json({
                status: 0,
                data: {},
                message: 'post of buy or sell not found 1'
            });
        }


        if (post.postType == global.POST_TYPE_BUY) {

            let buy = await BuyModel.findOne({
                _id: post.contentId
            });

            if (!buy) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'buy not found'
                });
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

            data = {
                title: buy.title,
                formality: buy.formality,
                type: buy.type,
                city: buy.city,
                district: buy.district,
                ward: buy.ward,
                street: buy.street,
                project: buy.project,
                area: buy.area,
                price: buy.price,
                unit: buy.unit,
                address: buy.address,
                keywordList: keys,
                description: buy.description,
                streetWidth: buy.streetWidth,
                frontSize: buy.frontSize,
                direction: buy.direction,
                balconyDirection: buy.balconyDirection,
                floorCount: buy.floorCount,
                bedroomCount: buy.bedroomCount,
                toiletCount: buy.toiletCount,
                furniture: buy.furniture,
                images: buy.images,
                contactName: buy.contactName,
                contactAddress: buy.contactAddress,
                contactPhone: buy.contactPhone,
                contactMobile: buy.contactMobile,
                contactEmail: buy.contactEmail,
                date: buy.date,

                createdByType: buy.createdByType ? buy.createdByType : null,

                id: post._id,
                customUrl: post.customUrl,
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
            }


        }

        if (post.postType == global.POST_TYPE_SALE) {
            console.log(post.contentId);
            let sale = await SaleModel.findOne({
                _id: post.contentId
            });

            if (!sale) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'sale not found'
                });
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

            data = {
                title: sale.title,
                description: sale.description,
                keywordList: keys,
                formality: sale.formality,
                type: sale.type,
                city: sale.city,
                district: sale.district,
                ward: sale.ward,
                street: sale.street,
                project: sale.project,
                areaMin: sale.areaMin,
                areaMax: sale.areaMax,
                priceMin: sale.priceMin,
                priceMax: sale.priceMax,
                unit: sale.unit,
                address: sale.address,
                images: sale.images,
                contactName: sale.contactName,
                contactAddress: sale.contactAddress,
                contactPhone: sale.contactPhone,
                contactMobile: sale.contactMobile,
                contactEmail: sale.contactEmail,
                receiveMail: sale.receiveMail,
                date: sale.date,

                createdByType: sale.createdByType ? sale.createdByType : null,

                id: post._id,
                url: post.url,
                customUrl: post.customUrl,
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
                textEndPage: post.textEndPage
            };
        }
    }

    return res.json({
        status: HttpCode.SUCCESS,
        type: post.postType,
        seo: {
            url: post.url,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            metaType: post.metaType,
            metaUrl: post.metaUrl,
            metaImage: post.metaImage,
            canonical: post.canonical,
            textEndPage: post.textEndPage
        },
        isList: false,
        related: related,
        params: query,
        data: data,
        message: 'request success'
    });
};

const mapBuyOrSaleItemToResultCaseCategory = (post, buyOrSale) => {
    const keywordList = (buyOrSale.keywordList || []).map(key => {
        return {
            keyword: key,
            slug: urlSlug(key)
        }
    });

    return Object.assign({},
                        buyOrSale.toObject(),
                        post.toObject(),
                        {id: post._id, keywordList});

    // return {
    //     formality: sale.formality,
    //     title: sale.title,
    //     description: sale.description,
    //     city: sale.city,
    //     district: sale.district,
    //     price: sale.price,
    //     unit: sale.unit,
    //     area: sale.area,
    //     date: sale.date,
    //     images: sale.images,
    //     address: sale.address,
    //     keywordList: keys,
    //     id: post._id,
    //     url: post.url,
    //     to: post.to,
    //     from: post.from,
    //     priority: post.priority,
    //     postType: post.postType,
    //     status: post.status,
    //     paymentStatus: post.paymentStatus,
    //     refresh: post.refresh,
    //     metaTitle: post.metaTitle,
    //     metaDescription: post.metaDescription,
    //     metaType: post.metaType,
    //     metaUrl: post.metaUrl,
    //     metaImage: post.metaImage,
    //     canonical: post.canonical,
    //     textEndPage: post.textEndPage
    // };
};

const handleSearchCaseCategory = async (res, param, page) => {
    const query = {status: global.STATUS.ACTIVE};
    let results = [];
    let count = 0;
    let cat = await UrlParamModel.findOne({param: param});

    if (cat) {
        mapCategoryToQuery(cat, query);
    }

    if (cat) {
        // model maybe: SaleModel, BuyModel, ProjectModel, NewsModel
        const model = getModelByCatPostType(cat);

        let data = await model.find(query)
            .sort({date: -1})
            .skip((page - 1) * global.PAGE_SIZE)
            .limit(global.PAGE_SIZE);

        count = await model.count(query);
        results = await Promise.all(data.map(async (item) => {
            const post = await PostModel.findOne({contentId: item._id});
            if (!post) {
                return {};
            }

            switch (cat.postType) {
                case global.POST_TYPE_SALE:
                case global.POST_TYPE_BUY:
                    return mapBuyOrSaleItemToResultCaseCategory(post, item);
                case global.POST_TYPE_PROJECT:
                case global.POST_TYPE_NEWS:
                    return Object.assign({}, post.toObject(), item.toObject(), {id: post._id});
            }
        }));
    }

    query.postType = cat.postType;

    return res.json({
        status: HttpCode.SUCCESS,
        type: cat.postType,
        seo: {
            url: cat.param,
            metaTitle: cat.metaTitle,
            metaDescription: cat.metaDescription,
            metaType: cat.metaType,
            metaUrl: cat.metaUrl,
            metaImage: cat.metaImage,
            canonical: cat.canonical,
            textEndPage: cat.textEndPage
        },
        isList: true,
        params: query,
        data: {
            itemCount: count,
            items: results,
            page: page,
            total: _.ceil(count / global.PAGE_SIZE)
        },
        message: 'Success'
    });
};

const SearchController = {
    filter: async function (req, res, next) {

        try {
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
            var areaMax = req.body.areaMax;
            var areaMin = req.body.areaMin;
            var area = req.body.area;
            var priceMax = req.body.priceMax;
            var priceMin = req.body.priceMin;
            var price = req.body.price;


            if (postType == 'null') {
                postType = undefined;
            }

            if (formality == 'null' || formality == undefined) {
                formality = undefined;
            } else {
                formality = formality.value
            }
            if (type == 'null' || type == undefined) {
                type = undefined;
            } else {
                type = type.value
            }
            if (city == 'null' || city == undefined) {
                city = undefined;
            } else {
                city = city.value
            }
            if (district == 'null' || district == undefined) {
                district = undefined;
            } else {
                district = district.value
            }
            if (ward == 'null' || ward == undefined) {
                ward = undefined;
            } else {
                ward = ward.value
            }
            if (street == 'null' || street == undefined) {
                street = undefined;
            } else {
                street = street.value
            }
            if (project == 'null' || project == undefined) {
                project = undefined;
            } else {
                project = project.value
            }
            if (balconyDirection == 'null' || balconyDirection == undefined) {
                balconyDirection = undefined;
            } else {
                balconyDirection = balconyDirection.value
            }
            if (bedroomCount == 'null' || bedroomCount == undefined) {
                bedroomCount = undefined;
            } else {
                bedroomCount = bedroomCount.value
            }
            if (areaMax == 'null' || areaMax == undefined) {
                areaMax = undefined;
            } else {
                areaMax = areaMax.value
            }
            if (areaMin == 'null' || areaMin == undefined) {
                areaMin = undefined;
            } else {
                areaMin = areaMin.value
            }
            if (area == 'null' || area == undefined) {
                area = undefined;
            } else {
                area = area.value
            }
            if (priceMax == 'null' || priceMax == undefined) {
                priceMax = undefined;
            } else {
                priceMax = priceMax.value
            }
            if (priceMin == 'null' || priceMin == undefined) {
                priceMin = undefined;
            } else {
                priceMin = priceMin.value
            }
            if (price == 'null' || price == undefined) {
                price = undefined;
            } else {
                price = price.value
            }

            let query = {
                postType: postType,
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
            };


            var cats = await UrlParamModel.find(query);
            var mainUrl = global.PARAM_NOT_FOUND;

            switch (postType) {
                case global.POST_TYPE_BUY :
                    mainUrl = global.PARAM_NOT_FOUND_BUY;
                    break;
                case global.POST_TYPE_SALE :
                    mainUrl = global.PARAM_NOT_FOUND_SALE;
                    break;
                case global.POST_TYPE_NEWS :
                    mainUrl = global.PARAM_NOT_FOUND_NEWS;
                    break;
                case global.POST_TYPE_PROJECT :
                    mainUrl = global.PARAM_NOT_FOUND_PROJECT;
                    break;

            }

            cats.forEach(cat => {


                if (cat.areaMax == areaMax && cat.areaMin == areaMin && cat.priceMax == priceMax && cat.priceMin == priceMin) {
                    return res.json({
                        status: 1,
                        data: {url: cat.param},
                        message: 'request success 1 !'
                    });
                }

                if (cat.areaMax == undefined && cat.areaMin == undefined && cat.priceMax == undefined && cat.priceMin == undefined) {
                    mainUrl = cat.url;
                }


            });


            var url = mainUrl + ((priceMax || priceMin) ? ('-gia' + (priceMin ? ('-tu-' + priceMin) : '') + (priceMax ? ('-den-' + priceMax) : '')) : '') + ((areaMax || areaMin) ? ('-dien-tich' + (areaMin ? ('-tu-' + areaMin) : '') + (areaMax ? ('-den-' + areaMax) : '')) : '');

            var param = await UrlParamModel.findOne({param: url});
            while (param) {
                url = url + '-';
                param = await UrlParamModel.findOne({param: url});
            }

            var cat = new UrlParamModel({
                postType: postType,
                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                areaMax: areaMax,
                areaMin: areaMin,
                area: area,
                priceMax: priceMax,
                priceMin: priceMin,
                price: price,
                param: url
            });


            cat = await cat.save();

            return res.json({
                status: 1,
                data: {url: cat.param},
                message: 'request success 2!'
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

    search: async function (req, res, next) {
        logger.info('SearchController::search is called');

        try {
            const url = req.query.url;
            let page = req.query.page;

            if (!page || page < 1) {
                page = 1;
            }

            if (!url || url.length === 0) {
                logger.error('SearchController::search::error. Url is required');
                return next(new Error('Url is required'));
            }

            const splitUrl = url.trim().split('/');

            if (!splitUrl || splitUrl.length !== 2) {
                logger.error('SearchController::search::error. Invalid url, splitUrl: ', splitUrl);
                return next(new Error('Invalid url'));
            }

            let slug = splitUrl[0];
            let param = splitUrl[1];

            if (!slug || slug.length === 0 || !param || param.length === 0) {
                logger.error('SearchController::search::error. Invalid url params, splitUrl: ', splitUrl);
                return next(new Error('Invalid url params'));
            }

            if (isValidSlugSearch(slug)) {
                return await handleSearchCaseNotCategory(res, param, slug);
            }

            if (isValidSlugCategorySearch(slug)) {
                return await handleSearchCaseCategory(res, param, page);
            }

            logger.error('SearchController::search:error. Invalid url. Not match case slug', url);
            return next(new Error('Invalid url. Not match case slug: ' + url));
        } catch (e) {
            logger.error('SearchController::search:error', e);
            return next(e);
        }
    }
};

module.exports = SearchController;
