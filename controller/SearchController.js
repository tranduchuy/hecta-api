const _ = require('lodash');
const UrlParamModel = require('../models/UrlParamModel');
const PostModel = require('../models/PostModel');
const BuyModel = require('../models/BuyModel');
const SaleModel = require('../models/SaleModel');
const NewsModel = require('../models/NewsModel');
const ProjectModel = require('../models/ProjectModel');
const TagModel = require('../models/TagModel');
const urlSlug = require('url-slug');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const HttpCode = require('../config/http-code');
const TitleService = require("../services/TitleService");

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

const isValidSlugTag = (slug) => {
    return slug === global.SLUG_TAG;
};

const mapCategoryToQuery = (catObj, query, additionalProperties = []) => {
    if (!catObj) {
        return;
    }

    const catProperties = [
        ...additionalProperties, 'formality', 'type', 'city', 'district',
        'ward', 'street', 'project', 'direction',
        'bedroomCount', 'areaMax', 'areaMin', 'area',
        'priceMax', 'priceMin', 'price'
    ];

    catProperties.forEach(field => {
        if (catObj[field]) {
            query[field] = catObj[field];
        }
    });
};

const handleSearchCaseNotCategory = async (res, param, slug, next) => {
    let data = {};
    let post = await PostModel.findOne({
        status: global.STATUS.ACTIVE,
        $or: [
            {url: param},
            {customUrl: param}
        ]
    });

    if (!post) {
        logger.error('SearchController::handleSearchCaseNotCategory::error Post not found');
        return next(new Error('Post not found'));
    }

    let cat = await UrlParamModel.findOne({_id: post.params});
    let query = {status: global.STATUS.ACTIVE};
    mapCategoryToQuery(cat, query, ['postType']);

    query._id = {$ne: post._id};

    let related = await PostModel.find(query).limit(10);

    if (slug === global.SLUG_NEWS) {
        if (post.postType !== global.POST_TYPE_NEWS) {
            logger.error('SearchController::handleSearchCaseNotCategory::error. Slug and post.postType not match SLUG_NEWS');
            return next(new Error('Slug and post.postType not match SLUG_NEWS'));
        }

        const news = await NewsModel.findOne({
            _id: post.contentId
        });
        if (!news) {
            logger.error('SearchController::handleSearchCaseNotCategory::error. News not found');
            return next(new Error('News not found'));
        }

        Object.assign(data, news.toObject(), post.toObject(), {id: post._id});
    }

    if (slug === global.SLUG_PROJECT) {
        if (post.postType !== global.POST_TYPE_PROJECT) {
            logger.error('SearchController::handleSearchCaseNotCategory::error. Slug and post.postType not match case SLUG_PROJECT');
            return next(new Error('Slug and post.postType not match case SLUG_PROJECT'));
        }

        const project = await ProjectModel.findOne({
            _id: post.contentId
        });

        if (!project) {
            logger.error('SearchController::handleSearchCaseNotCategory::error. Project not found');
            return next(new Error('Project not found'));
        }

        Object.assign(data, project.toObject(), post.toObject(), {id: post._id, createdByType: post.createdByType || null});
    }

    if (slug === global.SLUG_SELL_OR_BUY) {
        if (post.postType !== global.POST_TYPE_BUY && post.postType !== global.POST_TYPE_SALE) {
            logger.error('SearchController::handleSearchCaseNotCategory::error. Slug and post.postType not match case SLUG_SELL_OR_BUY');
            return next(new Error('Slug and post.postType not match case SLUG_SELL_OR_BUY'));
        }

        if (post.postType === global.POST_TYPE_BUY) {
            let buy = await BuyModel.findOne({
                _id: post.contentId
            });

            if (!buy) {
                logger.error('SearchController::handleSearchCaseNotCategory::error. Buy not found');
                return next(new Error('Buy not found'));
            }

            data = mapBuyOrSaleItemToResultCaseCategory(post, buy);
        }

        if (post.postType === global.POST_TYPE_SALE) {
            let sale = await SaleModel.findOne({
                _id: post.contentId
            });

            if (!sale) {
                logger.error('SearchController::handleSearchCaseNotCategory::error. Sale not found');
                return next(new Error('Sale not found'));
            }

            data = mapBuyOrSaleItemToResultCaseCategory(post, sale);
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
};

const handleSearchCaseCategory = async (res, param, page) => {
    const query = {status: global.STATUS.ACTIVE};
    let results = [];
    let count = 0;
    let cat = await UrlParamModel.findOne({
        $or: [
            {param},
            {customParam: param}
        ]
    });

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

        count = await model.countDocuments(query);
        results = await Promise.all(data.map(async (item) => {
            const post = await PostModel.findOne({contentId: item._id});
            if (!post) {
                return null;
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
    
    results = results.filter(function (el) {
        return el != null;
    });

    query.postType = cat.postType;

    return res.json({
        status: HttpCode.SUCCESS,
        type: cat.postType,
        seo: {
            url: cat.param,
            customUrl: cat.customParam,
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
        logger.info('SearchController::filter is called');
        try {
            let {
                formality, type, city, district, ward,
                street, project, direction, bedroomCount,
                areaMax, areaMin, area, priceMax, priceMin, price
            } = req.body;
    
            formality = formality? formality.value : null;
    
            type = type ? type.value : null;
    
            city = city ? city.value: null;
    
            district = district ? district.value : null;
    
            ward = ward ? ward.value : null;
    
            street = street ? street.value : null;
    
            project = project ? project.value : null;
    
            direction = (direction && (direction.value != "0")) ? direction.value : null;
    
            bedroomCount = (bedroomCount && (bedroomCount.value != "0")) ? bedroomCount.value : null;
    
            areaMax = areaMax ? areaMax.value : null;
    
            areaMin = areaMin ? areaMin.value : null;
    
            area = area ? area.value : null;
    
            priceMax = priceMax ? priceMax.value : null;
    
            priceMin = priceMin ? priceMin.value : null;
    
            price = price ? price.value : null;
    
            const postType = TitleService.getPostType(formality);

            const query = {
                postType,
                formality,
                type,
                city,
                district,
                ward,
                street,
                project,
                direction,
                bedroomCount,
                //Todo
                // area,
                // price
            };

            let cat = await UrlParamModel.findOne(query);
            
            if (cat){
                return res.json({
                    status: HttpCode.SUCCESS,
                    //Todo return data list post
                    data: {url: cat.param},
                    message: 'Success'
                });
            }
    
            // Insert new param to UrlParams
            let url = TitleService.getTitle(query) + ' ' +
                        TitleService.getLocationTitle(query) + ' ' +
                        TitleService.getOrderTitle(query);
            url = urlSlug(url.trim());
            
            let countDuplicate = await UrlParamModel.countDocuments({param: url});
            if (countDuplicate > 0) url = url + "-" + countDuplicate;

            cat = new UrlParamModel({
                postType,
                formality,
                type,
                city,
                district,
                ward,
                street,
                project,
                direction,
                bedroomCount,
                //Todo
                // area,
                // price
                param: url,
            });
            await cat.save();

            return res.json({
                status: HttpCode.SUCCESS,
                data: {url},
                message: 'Success'
            });
        } catch (e) {
            logger.error('SearchController::filter::error', e);
            return next(e);
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
                return await handleSearchCaseNotCategory(res, param, slug, next);
            }

            if (isValidSlugCategorySearch(slug)) {
                return await handleSearchCaseCategory(res, param, page, next);
            }

            logger.error('SearchController::search:error. Invalid url. Not match case slug', url);
            return next(new Error('Invalid url. Not match case slug: ' + url));
        } catch (e) {
            logger.error('SearchController::search:error', e);
            return next(e);
        }
    },

    getUrlToRedirect: async (req, res, next) => {
        logger.info('SearchController::getUrlToRedirect is called');

        try {
            const url = req.query.url;

            if (!url || url.length === 0) {
                logger.error('SearchController::getUrlToRedirect::error. Url is required');
                return next(new Error('Url is required'));
            }

            const splitUrl = url.trim().split('/');

            if (!splitUrl || splitUrl.length !== 2) {
                logger.error('SearchController::getUrlToRedirect::error. Invalid url, splitUrl: ', splitUrl);
                return next(new Error('Invalid url'));
            }

            let slug = splitUrl[0];
            let param = splitUrl[1];

            if (!slug || slug.length === 0 || !param || param.length === 0) {
                logger.error('SearchController::getUrlToRedirect::error. Invalid url params, splitUrl: ', splitUrl);
                return next(new Error('Invalid url params'));
            }

            if (isValidSlugSearch(slug)) {
                let post = await PostModel.findOne({
                    status: global.STATUS.ACTIVE,
                    $or: [
                        {url: param},
                        {customUrl: param}
                    ]
                });

                if (!post) {
                    return res.json({
                       status: HttpCode.ERROR,
                       message: ['Post not found'],
                       data: {}
                    });
                }

                return res.json({
                    status: HttpCode.SUCCESS,
                    message: ['Success'],
                    data: {
                        url: `${slug}/${post.customUrl || post.url}`
                    }
                });
            }

            if (isValidSlugCategorySearch(slug)) {
                let cat = await UrlParamModel.findOne({
                    $or: [
                        {param},
                        {customParam: param}
                    ]
                });

                if (!cat) {
                    return res.json({
                        status: HttpCode.ERROR,
                        message: ['Category not found'],
                        data: {}
                    });
                }

                return res.json({
                    status: HttpCode.SUCCESS,
                    message: ['Success'],
                    data: {
                        url: `${slug}/${cat.customParam || cat.param}`
                    }
                });
            }

            if (isValidSlugTag(slug)) {
                const tag = await TagModel.findOne({
                    $or: [
                        {slug: param},
                        {customSlug: param}
                    ]
                });

                if (!tag) {
                    return res.json({
                        status: HttpCode.ERROR,
                        message: ['Tag not found'],
                        data: {}
                    });
                }

                return res.json({
                    status: HttpCode.SUCCESS,
                    message: ['Success'],
                    data: {
                        url: `${slug}/${tag.customSlug || tag.slug}`
                    }
                });
            }

            logger.error('SearchController::getUrlToRedirect:error. Invalid url. Not match case slug', url);
            return next(new Error('Invalid url. Not match case slug: ' + url));
        } catch (e) {
            logger.error('SearchController::getUrlToRedirect:error', e);
            return next(e);
        }
    }
};

module.exports = SearchController;
