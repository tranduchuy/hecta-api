var ProjectModel = require('../models/ProjectModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var UrlParamModel = require('../models/UrlParamModel');
var urlSlug = require('url-slug');

var ProjectController = {


    add: async function (req, res, next) {

        try {

            var token = req.headers.access_token;


            var isShowOverview = req.body.isShowOverview;

            var type = req.body.type;
            var introImages = req.body.introImages;
            var title = req.body.title;
            var address = req.body.address;
            var area = req.body.area;
            var projectScale = req.body.projectScale;
            var price = req.body.price;
            var deliveryHouseDate = req.body.deliveryHouseDate;
            var constructionArea = req.body.constructionArea;
            var descriptionInvestor = req.body.descriptionInvestor;
            var description = req.body.description;

            var isShowLocationAndDesign = req.body.isShowLocationAndDesign;
            var infrastructure = req.body.infrastructure;
            var location = req.body.location;

            var isShowGround = req.body.isShowGround;
            var overallSchema = req.body.overallSchema;
            var groundImages = req.body.groundImages;

            var isShowImageLibs = req.body.isShowImageLibs;
            var imageAlbums = req.body.imageAlbums;


            var isShowProjectProgress = req.body.isShowProjectProgress;
            var projectProgressTitle = req.body.projectProgressTitle;
            var projectProgressStartDate = req.body.projectProgressStartDate;
            var projectProgressEndDate = req.body.projectProgressEndDate;
            var projectProgressDate = req.body.projectProgressDate;
            var projectProgressImages = req.body.projectProgressImages;


            var isShowTabVideo = req.body.isShowTabVideo;
            var video = req.body.video;

            var isShowFinancialSupport = req.body.isShowFinancialSupport;
            var financialSupport = req.body.financialSupport;

            var isShowInvestor = req.body.isShowInvestor;
            var detailInvestor = req.body.detailInvestor;

            var district = req.body.district;
            var city = req.body.city;


            var project = new ProjectModel();

            project.district = district;
            project.city = city;

            project.isShowOverview = isShowOverview;

            project.type = type;
            project.introImages = introImages;
            project.title = title;
            project.address = address;
            project.area = area;
            project.projectScale = projectScale;
            project.price = price;
            project.deliveryHouseDate = deliveryHouseDate;
            project.constructionArea = constructionArea;
            project.descriptionInvestor = descriptionInvestor;
            project.description = description;

            project.isShowLocationAndDesign = isShowLocationAndDesign;
            project.infrastructure = infrastructure;
            project.location = location;

            project.isShowGround = isShowGround;
            project.overallSchema = overallSchema;
            project.groundImages = groundImages;

            project.isShowImageLibs = isShowImageLibs;
            project.imageAlbums = imageAlbums;

            project.isShowProjectProgress = isShowProjectProgress;
            project.projectProgressTitle = projectProgressTitle;
            project.projectProgressStartDate = projectProgressStartDate;
            project.projectProgressEndDate = projectProgressEndDate;
            project.projectProgressDate = projectProgressDate;
            project.projectProgressImages = projectProgressImages;


            project.isShowTabVideo = isShowTabVideo;
            project.video = video;

            project.isShowFinancialSupport = isShowFinancialSupport;
            project.financialSupport = financialSupport;

            project.isShowInvestor = isShowInvestor;
            project.detailInvestor = detailInvestor;


            project = await project.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_PROJECT;
            post.type = project.type;
            post.content_id = project._id;


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
                postType: global.POST_TYPE_PROJECT,

                formality: undefined,
                type: type,
                city: city,
                district: district,
                ward: undefined,
                street: undefined,
                project: undefined,
                balconyDirection: undefined,
                bedroomCount: undefined,
                area: undefined,
                price: price
            });

            let mainUrl = !param ? global.PARAM_NOT_FOUND_PROJECT : param.param;

            post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();

            post = await post.save();


            return res.json({
                status: 1,
                data: post,
                message: 'request post project success !'
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
module.exports = ProjectController
