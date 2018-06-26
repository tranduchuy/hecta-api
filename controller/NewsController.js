var NewsModel = require('../models/NewsModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var UrlParamModel = require('../models/UrlParamModel');
var urlSlug = require('url-slug');

var NewsController = {

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

            if (title) {
                news.title = title;
            }
            if (content) {
                news.content = content;
            }
            if (cate) {
                news.cate = cate;
            }
            if (image) {
                news.image = image;
            }
            if (status) {
                news.status = status;
            }
            news = await news.save();

            let post = await PostModel.findOne({content_id: news._id})

            if (post) {

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
                status: 0,
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
                    cate: news.cate,
                    image: news.image
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


            var title = req.body.title;
            var content = req.body.content;
            var cate = req.body.cate;
            var image = req.body.image;


            var news = new NewsModel();

            news.title = title;
            news.content = content;
            news.cate = cate;
            news.image = image;


            news = await news.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_NEWS;
            post.type = news.cate;
            post.content_id = news._id;


            if (token) {

                var accessToken = await  TokenModel.findOne({token: token});

                if (!accessToken) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'access token invalid'
                    });

                }

                post.user = accessToken.user;


            }
            else {
                if (!accessToken) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'access token empty'
                    });

                }
            }

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
