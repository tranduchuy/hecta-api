const NewsModel = require('../../models/NewsModel');
const PostModel = require('../../models/PostModel');
const UrlParamModel = require('../../models/UrlParamModel');
const urlSlug = require('url-slug');
const ImageService = require('../../services/ImageService');
const HttpCode = require('../../config/http-code');
const mongoose = require('mongoose');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');

const NewsController = {
    catList: async function (req, res) {
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.status) === -1) {
                return res.json({
                    status: HttpCode.BAD_REQUEST,
                    data: {},
                    message: 'Permission denied'
                });
            }

            const cats = await UrlParamModel.find({postType: global.POST_TYPE_NEWS});
            const results = cats.map(cat => {
                return {text: cat.text, id: cat.type, url: cat.param, extra: cat.extra};
            });

            return res.json({
                status: HttpCode.SUCCESS,
                data: results,
                message: 'success !'
            });
        } catch (e) {
            return res.json({
                status: HttpCode.ERROR,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    },

    update: async function (req, res, next) {
        logger.info('Admin/NewsController::update is called');
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.status) === -1) {
                return next(new Error('Permission denied'));
            }

            let id = req.params.id;
            if (!id || id.length === 0) {
                return next(new Error('Invalid id'));
            }

            let post = await PostModel.findOne({_id: id});
            if (!post) {
                logger.error('Admin/NewsController::update::error. Post not found');
                return next(new Error('Post not found'));
            }

            let news = await NewsModel.findOne({
                _id: post.contentId,
                status: {$in: [global.STATUS.ACTIVE, global.STATUS.BLOCKED]}
            });

            if (!news) {
                return res.json({
                    status: HttpCode.BAD_REQUEST,
                    data: {},
                    message: 'news not exist '
                });
            }

            const {
                title, content, cate, image, status,
                description, metaTitle, metaDescription,
                metaType, metaUrl, metaImage, canonical,
                textEndPage, url
            } = req.body;
            ImageService.putUpdateImage([news.image], [image]);

            news.title = title || news.title;
            news.content = content || news.content;
            news.type = cate || news.type;
            news.image = image || news.image;
            news.description = description || news.description;
            news.status = status || news.status;
            news.admin = (news.admin || []).push(new mongoose.Types.ObjectId(admin._id));
            news = await news.save();

            post.status = news.status;
            post.textEndPage = textEndPage || post.textEndPage;
            post.metaTitle = metaTitle || post.metaTitle;
            post.metaDescription = metaDescription || post.metaDescription;
            post.metaType = metaType || post.metaType;
            post.metaUrl = metaUrl || post.metaUrl;
            post.metaImage = metaImage || post.metaImage;
            post.canonical = canonical || post.canonical;

            if (title) {
                let param = await UrlParamModel.findOne({
                    postType: global.POST_TYPE_NEWS,
                    formality: undefined,
                    type: cate,
                    city: undefined,
                    district: undefined,
                    ward: undefined,
                    street: undefined,
                    project: undefined,
                    balconyDirection: undefined,
                    bedroomCount: undefined,
                    area: undefined,
                    price: undefined
                });

                if (!param) {
                    param = await param.save();
                }

                let _url = urlSlug(title);
                const count = await PostModel.find({url: new RegExp("^" + _url)});

                if (count > 0) {
                    _url += ('-' + count);
                }

                post.url = _url;
                post.params = param._id;
            }

            const customUrl = url;
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

            await post.save();

            return res.json({
                status: HttpCode.SUCCESS,
                data: news,
                message: 'Success'
            });
        } catch (e) {
            return res.json({
                status: HttpCode.ERROR,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    },

    add: async function (req, res, next) {
        logger.info('Admin/NewsController::add is called');
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.status) === -1) {
                logger.error('Admin/NewsController::add::error. Permission denied');
                return next(new Error('Permission denied'));
            }

            const {
                title, content, cate, image, description,
                metaTitle, metaDescription, metaType, metaUrl,
                metaImage, canonical, textEndPage, createdByType
            } = req.body;
            let news = new NewsModel();
    
            if (createdByType) {
                const duplicateTitle = await NewsModel.findOne({title: req.body.title});
                if (duplicateTitle) {
                    logger.warn('Admin/NewsController::add::error. Crawling duplicated title');
                    return next(new Error('Crawler duplicate title'));
                }
            }
            
            news.title = title;
            news.content = content;
            news.type = cate;
            news.image = image;
            news.description = description;
            news.status = global.STATUS.ACTIVE;
            news.admin = [new mongoose.Types.ObjectId(admin._id)];
            news.createdByType = createdByType || global.CREATED_BY.HAND;
            ImageService.postConfirmImage([image]);
            news = await news.save();

            const post = new PostModel();
            post.postType = global.POST_TYPE_NEWS;
            post.type = news.type;
            post.status = global.STATUS.ACTIVE;
            post.paymentStatus = global.STATUS.PAYMENT_FREE;
            post.contentId = news._id;

            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_NEWS,
                formality: undefined,
                type: cate,
                city: undefined,
                district: undefined,
                ward: undefined,
                street: undefined,
                project: undefined,
                balconyDirection: undefined,
                bedroomCount: undefined,
                area: undefined,
                price: undefined
            });

            if (!param) {
                param = await param.save();
            }

            let url = urlSlug(title);
            const count = await PostModel.find({url: new RegExp("^" + url)});

            if (count > 0) {
                url += ('-' + count);
            }

            post.url = url;
            post.params = param._id;
            post.metaTitle = metaTitle;
            post.metaDescription = metaDescription;
            post.metaType = metaType;
            post.metaUrl = metaUrl;
            post.metaImage = metaImage;
            post.canonical = canonical;
            post.textEndPage = textEndPage;
            await post.save();

            return res.json({
                status: HttpCode.SUCCESS,
                data: post,
                message: 'Success'
            });
        } catch (e) {
            logger.error('Admin/NewsController::add:error', e);
            return next(e);
        }
    }
};

module.exports = NewsController;
