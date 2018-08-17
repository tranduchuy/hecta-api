var NewsModel = require('../../models/NewsModel');
var PostModel = require('../../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');
var UrlParamModel = require('../../models/UrlParamModel');
var urlSlug = require('url-slug');

var NewsController = {

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
                status: global.STATUS_ACTIVE,
                role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
            });

            let id = req.params.id;


            if (!admin) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin not found or blocked'
                });

            }

            if (!id || id.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id null error'
                });

            }

            let news = await NewsModel.findOne({_id: id});

            if (!news) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });
            }


            return res.json({
                status: 1,
                data: {
                    id: news._id,
                    title: news.title,
                    content: news.content,
                    cate: news.type,
                    image: news.image,
                    description: news.description,
                    date: news.date,
                    metaTitle: news.metaTitle,
                    metaDescription: news.metaDescription,
                    metaType: news.metaType,
                    metaUrl: news.metaUrl,
                    metaImage: news.metaImage,
                    canonical: news.canonical

                },
                message: 'request success'
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
                status: global.STATUS_ACTIVE,
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
                status: global.STATUS_ACTIVE,
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


            var news = await NewsModel.findOne({_id: id});

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

            var status = req.body.status;
            var description = req.body.description;


            var metaTitle = req.body.metaTitle;
            var metaDescription = req.body.metaDescription;
            var metaType = req.body.metaType;
            var metaUrl = req.body.metaUrl;
            var metaImage = req.body.metaImage;
            var canonical = req.body.canonical;


            // metaTitle: project.metaTitle,
            //     metaDescription: project.metaDescription,
            //     metaType: project.metaType,
            //     metaUrl: project.metaUrl,
            //     metaImage: project.metaImage,
            //     canonical: project.canonical

            if (metaTitle) {
                news.metaTitle = metaTitle;
            }

            if (metaDescription) {
                news.metaDescription = metaDescription;
            }

            if (metaType) {
                news.metaType = metaType;
            }

            if (metaUrl) {
                news.metaUrl = metaUrl;
            }

            if (metaImage) {
                news.metaImage = metaImage;
            }

            if (canonical) {
                news.canonical = canonical;
            }


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

            let post = await PostModel.findOne({content_id: news._id})

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

                let mainUrl = !param ? global.PARAM_NOT_FOUND_NEWS : param.param;

                post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();

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
                status: global.STATUS_ACTIVE,
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

            if (!page || page < 1) {
                page = 1;
            }

            let newsList = await NewsModel.find().sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);

            let results = await Promise.all(newsList.map(async news => {

                let post = await PostModel.findOne({content_id: news._id});


                let result = {

                    id: news._id,
                    status: news.status,
                    title: news.title,
                    content: news.content,
                    cate: news.type,
                    image: news.image,
                    date: news.date,
                    description: news.description,
                    metaTitle: news.metaTitle,
                    metaDescription: news.metaDescription,
                    metaType: news.metaType,
                    metaUrl: news.metaUrl,
                    metaImage: news.metaImage,
                    canonical: news.canonical

                };

                if (post) {
                    result.url = post.url;
                }

                return result;

            }));


            let count = await NewsModel.count();

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
                status: global.STATUS_ACTIVE,
                role: {$in: [global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN]}
            });

            if (!admin) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'admin not found or blocked'
                });

            }

            var title = req.body.title;
            var content = req.body.content;
            var cate = req.body.cate;
            var image = req.body.image;
            var description = req.body.description;

            var metaTitle = req.body.metaTitle;
            var metaDescription = req.body.metaDescription;
            var metaType = req.body.metaType;
            var metaUrl = req.body.metaUrl;
            var metaImage = req.body.metaImage;
            var canonical = req.body.canonical;


            var news = new NewsModel();

            news.metaTitle = metaTitle;
            news.metaDescription = metaDescription;
            news.metaType = metaType;
            news.metaUrl = metaUrl;
            news.metaImage = metaImage;
            news.canonical = canonical;

            news.title = title;
            news.content = content;
            news.type = cate;
            news.image = image;
            news.description = description;
            news.status = global.STATUS_POST_ACTIVE;

            project.admin = [accessToken.user];

            news = await news.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_NEWS;
            post.type = news.type;
            post.status = global.STATUS_POST_ACTIVE;
            post.paymentStatus = global.STATUS_PAYMENT_FREE;
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

            let mainUrl = !param ? global.PARAM_NOT_FOUND_NEWS : param.param;

            post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();

            post = await post.save();


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
