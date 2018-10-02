var NewsModel = require('../../models/NewsModel');
var PostModel = require('../../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');
var UrlParamModel = require('../../models/UrlParamModel');
var urlSlug = require('url-slug');

var ImageService = require('../../services/ImageService');

var NewsController = {

    // detail: async function (req, res, next) {
    //     try {
    //
    //         var token = req.headers.access_token;
    //         var accessToken = await  TokenModel.findOne({token: token});
    //
    //         if (!accessToken) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'access token invalid'
    //             });
    //
    //         }
    //
    //         var admin = await UserModel.findOne({
    //             _id: accessToken.user,
    //             status: global.STATUS.ACTIVE,
    //             role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
    //         });
    //
    //         let id = req.params.id;
    //
    //
    //         if (!admin) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'admin not found or blocked'
    //             });
    //
    //         }
    //
    //         if (!id || id.length == 0) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'id null error'
    //             });
    //
    //         }
    //
    //         let news = await NewsModel.findOne({
    //             _id: id,
    //             status: {$in: [global.STATUS.ACTIVE, global.STATUS.BLOCKED]}
    //         });
    //
    //         if (!news) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'data not exist'
    //             });
    //         }
    //
    //
    //         let post = await PostModel.findOne({content_id: news._id});
    //
    //         if (!post) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'post not exist'
    //             });
    //         }
    //
    //
    //         return res.json({
    //             status: 1,
    //             data: {
    //                 id: post._id,
    //                 title: news.title,
    //                 content: news.content,
    //                 cate: news.type,
    //                 image: news.image,
    //                 description: news.description,
    //                 date: news.date,
    //
    //
    //                 metaTitle: post.metaTitle,
    //                 metaDescription: post.metaDescription,
    //                 metaType: post.metaType,
    //                 metaUrl: post.metaUrl,
    //                 metaImage: post.metaImage,
    //                 canonical: post.canonical,
    //                 textEndPage: post.textEndPage,
    //                 url: post.url
    //
    //             },
    //             message: 'request success'
    //         });
    //
    //
    //     }
    //
    //     catch (e) {
    //         return res.json({
    //             status: 0,
    //             data: {},
    //             message: 'unknown error : ' + e.message
    //         });
    //     }
    //
    //
    // },
    catList: async function (req, res, next) {
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

            var cats = await UrlParamModel.find({postType: 4});


            let results = cats.map(cat => {

                return {text: cat.text, id: cat.type, url: cat.param, extra: cat.extra};

            });

            return res.json({
                status: 1,
                data: results,
                message: 'success !'
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
    update: async function (req, res, next) {


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
                    message: 'id invalid '
                });
            }

            let post = await PostModel.findOne({_id: id});

            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post of news not exist '
                });
            }

            var news = await NewsModel.findOne({
                _id: post.content_id,
                status: {$in: [global.STATUS.ACTIVE, global.STATUS.BLOCKED]}
            });

            if (!news) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'news not exist '
                });
            }

            var title = req.body.title;

            var content = req.body.content;
            var cate = req.body.cate;
            var image = req.body.image;
            ImageService.putUpdateImage([news.image], [image]);

            var status = req.body.status;
            var description = req.body.description;


            var metaTitle = req.body.metaTitle;
            var metaDescription = req.body.metaDescription;
            var metaType = req.body.metaType;
            var metaUrl = req.body.metaUrl;
            var metaImage = req.body.metaImage;
            var canonical = req.body.canonical;
            var textEndPage = req.body.textEndPage;


            if (title) {
                news.title = title;
            }
            if (content) {
                news.content = content;
            }
            if (cate) {
                news.type = cate;
            }
            if (image) {
                news.image = image;
            }
            if (description) {
                news.description = description;
            }
            if (status != undefined) {
                news.status = status;
            }

            if (!news.admin) {
                news.admin = [];
            }

            news.admin.push(accessToken.user);

            news = await news.save();


            if (textEndPage) {
                post.textEndPage = textEndPage;
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
                var url = urlSlug(title);

                var count = await PostModel.find({url: new RegExp("^" + url)});

                if (count > 0) {
                    url += ('-' + count);
                }

                post.url = url;
                post.params = param._id;

                await post.save();
            }

            return res.json({
                status: 1,
                data: news,
                message: 'update success'
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
    // ,
    // list: async function (req, res, next) {
    //
    //     try {
    //
    //         var token = req.headers.access_token;
    //         var accessToken = await  TokenModel.findOne({token: token});
    //
    //         if (!accessToken) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'access token invalid'
    //             });
    //
    //         }
    //
    //         var admin = await UserModel.findOne({
    //             _id: accessToken.user,
    //             status: global.STATUS.ACTIVE,
    //             role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
    //         });
    //
    //         if (!admin) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'admin not found or blocked'
    //             });
    //
    //         }
    //
    //         var page = req.query.page;
    //
    //         if (!page || page < 1) {
    //             page = 1;
    //         }
    //
    //         let newsList = await NewsModel.find({status: {$in: [global.STATUS.ACTIVE, global.STATUS.BLOCKED]}}).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
    //
    //         let results = await Promise.all(newsList.map(async news => {
    //
    //
    //             let result = {
    //
    //                 status: news.status,
    //                 title: news.title,
    //                 content: news.content,
    //                 cate: news.type,
    //                 image: news.image,
    //                 date: news.date,
    //                 description: news.description,
    //
    //
    //             };
    //
    //             let post = await PostModel.findOne({content_id: news._id});
    //
    //             if (post) {
    //                 result.id = post._id;
    //                 result.url = post.url;
    //                 result.metaTitle = post.metaTitle;
    //                 result.metaDescription = post.metaDescription;
    //                 result.metaType = post.metaType;
    //                 result.metaUrl = post.metaUrl;
    //                 result.metaImage = post.metaImage;
    //                 result.canonical = post.canonical;
    //                 result.textEndPage = post.textEndPage
    //             }
    //
    //             return result;
    //
    //         }));
    //
    //
    //         let count = await NewsModel.count({status: {$in: [global.STATUS.ACTIVE, global.STATUS.BLOCKED]}});
    //
    //         return res.json({
    //             status: 1,
    //             data: {
    //                 itemCount: count,
    //                 items: results,
    //                 page: page,
    //                 total: _.ceil(count / global.PAGE_SIZE)
    //             },
    //             message: 'request success '
    //         });
    //     }
    //     catch (e) {
    //         return res.json({
    //             status: 0,
    //             data: {},
    //             message: 'unknown error : ' + e.message
    //         });
    //     }
    //
    // },

    add: async function (req, res, next) {

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

            const {title, content, cate, image, description,
                metaTitle, metaDescription, metaType, metaUrl,
                metaImage, canonical, textEndPage, createdByType} = req.body;
            let news = new NewsModel();
            news.title = title;
            news.content = content;
            news.type = cate;
            news.image = image;
            news.description = description;
            news.status = global.STATUS.ACTIVE;
            news.admin = [accessToken.user];
            ImageService.postConfirmImage([image]);

            if (createdByType) {
                news.createdByType = createdByType;
            } else {
                news.createdByType = global.CREATED_BY.HAND;
            }

            news = await news.save();

            var post = new PostModel();

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
            var url = urlSlug(title);

            var count = await PostModel.find({url: new RegExp("^" + url)});

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
                status: 1,
                data: post,
                message: 'request post news success !'
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
module.exports = NewsController
