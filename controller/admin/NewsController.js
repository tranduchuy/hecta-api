const NewsModel = require('../../models/NewsModel');
const PostModel = require('../../models/PostModel');
const UrlParamModel = require('../../models/UrlParamModel');
const urlSlug = require('url-slug');
const ImageService = require('../../services/ImageService');
const HttpCode = require('../../config/http-code');

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

    update: async function (req, res) {
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.status) === -1) {
                return res.json({
                    status: HttpCode.BAD_REQUEST,
                    data: {},
                    message: 'Permission denied'
                });
            }

            let id = req.params.id;

            if (!id || id.length === 0) {
                return res.json({
                    status: HttpCode.ERROR,
                    data: {},
                    message: 'id invalid'
                });
            }

            let post = await PostModel.findOne({_id: id});

            if (!post) {
                return res.json({
                    status: HttpCode.ERROR,
                    data: {},
                    message: 'post of news not exist '
                });
            }

            let news = await NewsModel.findOne({
                _id: post.content_id,
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
                textEndPage
            } = req.body;
            ImageService.putUpdateImage([news.image], [image]);

            news.title = title || news.title;
            news.content = content || news.content;
            news.type = cate || news.type;
            news.image = image || news.image;
            news.description = description || news.description;
            news.status = status || news.status;
            news.admin = (news.admin || []).push(admin._id);
            news = await news.save();

            post.textEndPage = textEndPage || post.textEndPage;
            post.metaTitle = metaTitle || post.metaTitle;
            post.metaDescription = metaDescription || post.metaDescription;
            post.metaType = metaType || post.metaType;
            post.metaUrl = metaUrl || post.metaUrl;
            post.metaImage = metaImage || post.metaImage;
            post.canonical = canonical || post.canonical;

            if (title && post) {
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

                await post.save();
            }

            return res.json({
                status: HttpCode.SUCCESS,
                data: news,
                message: 'update success'
            });
        } catch (e) {
            return res.json({
                status: HttpCode.ERROR,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    },

    add: async function (req, res) {
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.status) === -1) {
                return res.json({
                    status: HttpCode.BAD_REQUEST,
                    data: {},
                    message: 'Permission denied'
                });
            }

            const {
                title, content, cate, image, description,
                metaTitle, metaDescription, metaType, metaUrl,
                metaImage, canonical, textEndPage, createdByType
            } = req.body;
            let news = new NewsModel();
            news.title = title;
            news.content = content;
            news.type = cate;
            news.image = image;
            news.description = description;
            news.status = global.STATUS.ACTIVE;
            news.admin = [admin._id];
            news.createdByType = createdByType || global.CREATED_BY.HAND;
            ImageService.postConfirmImage([image]);
            news = await news.save();

            const post = new PostModel();
            post.postType = global.POST_TYPE_NEWS;
            post.type = news.type;
            post.status = global.STATUS.ACTIVE;
            post.paymentStatus = global.STATUS.PAYMENT_FREE;
            post.content_id = news._id;

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
                message: 'request post news success !'
            });
        }
        catch (e) {
            return res.json({
                status: HttpCode.ERROR,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }
    }
};

module.exports = NewsController;
