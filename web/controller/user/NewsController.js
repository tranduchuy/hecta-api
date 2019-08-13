var NewsModel = require('../../models/NewsModel');
var PostModel = require('../../models/PostModel');
var _ = require('lodash');
const EU = require('express-useragent');

var NewsController = {

    highlight: async function (req, res, next) {
        try {
            const result = {
                phongThuy: [],
                thietKeKienTruc: []
            }

            // phongThuy
            const phongThuyNews = await NewsModel.find({
                status : global.STATUS.ACTIVE,
                type: 9
            }).sort({date: -1}).limit(6);

            result.phongThuy = await Promise.all(phongThuyNews.map(async news => {
                let post = await PostModel.findOne({contentId: news._id});
                let result = {
                    id: news._id,
                    title: news.title,
                    cate: news.type,
                    image: news.image,
                    date: news.date,
                };

                if (post) {
                    result.url = post.url;
                }

                return result;
            }));

            // thietKeKienTruc
            const thietKeKienTrucNews = await NewsModel.find({
                status : global.STATUS.ACTIVE,
                type: {
                    $in: [101, 102, 103]
                }
            }).sort({date: -1}).limit(6);

            result.thietKeKienTruc = await Promise.all(thietKeKienTrucNews.map(async news => {
                let post = await PostModel.findOne({contentId: news._id});
                let result = {
                    id: news._id,
                    title: news.title,
                    cate: news.type,
                    image: news.image,
                    date: news.date,
                };

                if (post) {
                    result.url = post.url;
                }

                return result;
            }));

            return res.json({
                status: 1,
                data: result,
                message: 'request success '
            });
        }
        catch (e) {
            return next(e);
        }
    },
    latest: async function (req, res, next) {

        try {
            let newsList = await NewsModel.find({status : global.STATUS.ACTIVE}).sort({date: -1}).limit(10);
            let results = await Promise.all(newsList.map(async news => {
                let post = await PostModel.findOne({contentId: news._id});
                let result = {
                    id: news._id,
                    title: news.title,
                    image: news.image,
                    date: news.date,
                };

                if (post) {
                    result.url = post.url;
                }

                return result;
            }));

            return res.json({
                status: 1,
                data: results,
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
}
module.exports = NewsController
