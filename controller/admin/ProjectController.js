var ProjectModel = require('../../models/ProjectModel');
var PostModel = require('../../models/PostModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');
var UrlParamModel = require('../../models/UrlParamModel');
var urlSlug = require('url-slug');

var ProjectController = {


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
    //             status: global.STATUS_ACTIVE,
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
    //         if (!id || id.length == 0) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'id null error'
    //             });
    //
    //         }
    //         let id = req.params.id;
    //
    //         let project = await ProjectModel.findOne({
    //             _id: id,
    //             status: {$in: [global.STATUS_ACTIVE, global.STATUS_BLOCKED]}
    //         });
    //
    //         if (!project) {
    //             return res.json({
    //                 status: 0,
    //                 data: {},
    //                 message: 'data not exist'
    //             });
    //         }
    //
    //         let post = await PostModel.findOne({content_id: project._id});
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
    //                 isShowOverview: project.isShowOverview,
    //                 type: project.type,
    //                 introImages: project.introImages,
    //                 title: project.title,
    //                 address: project.address,
    //                 area: project.area,
    //                 projectScale: project.projectScale,
    //                 price: project.price,
    //                 deliveryHouseDate: project.deliveryHouseDate,
    //                 constructionArea: project.constructionArea,
    //                 descriptionInvestor: project.descriptionInvestor,
    //                 description: project.description,
    //
    //                 isShowLocationAndDesign: project.isShowLocationAndDesign,
    //                 location: project.location,
    //                 infrastructure: project.infrastructure,
    //
    //                 isShowGround: project.isShowGround,
    //                 overallSchema: project.overallSchema,
    //                 groundImages: project.groundImages,
    //
    //                 isShowImageLibs: project.isShowImageLibs,
    //                 imageAlbums: project.imageAlbums,
    //
    //                 isShowProjectProgress: project.isShowProjectProgress,
    //                 projectProgressTitle: project.projectProgressTitle,
    //                 projectProgressStartDate: project.projectProgressStartDate,
    //                 projectProgressEndDate: project.projectProgressEndDate,
    //                 projectProgressDate: project.projectProgressDate,
    //                 projectProgressImages: project.projectProgressImages,
    //
    //                 isShowTabVideo: project.isShowTabVideo,
    //                 video: project.video,
    //
    //                 isShowFinancialSupport: project.isShowFinancialSupport,
    //                 financialSupport: project.financialSupport,
    //
    //                 isShowInvestor: project.isShowInvestor,
    //                 detailInvestor: project.detailInvestor,
    //
    //                 district: project.district,
    //                 city: project.city,
    //
    //                 status: project.status,
    //
    //                 id: post._id,
    //                 metaTitle: post.metaTitle,
    //                 metaDescription: post.metaDescription,
    //                 metaType: post.metaType,
    //                 metaUrl: post.metaUrl,
    //                 metaImage: post.metaImage,
    //                 canonical: post.canonical,
    //                 textEndPage: post.textEndPage,
    //                 url: post.url
    //
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
    typeList: async function (req, res, next) {
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

            var types = await UrlParamModel.find({postType: 3});


            let results = types.map(type => {

                return {text: type.text, id: type.type, url: type.param};

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

            var post = await PostModel.findOne({_id: id});

            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post of project not exist '
                });
            }
            var project = await ProjectModel.findOne({_id: post.content_id});

            if (!project) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'project not exist '
                });
            }

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
            var status = req.body.status;


            var metaTitle = req.body.metaTitle;
            var metaDescription = req.body.metaDescription;
            var metaType = req.body.metaType;
            var metaUrl = req.body.metaUrl;
            var metaImage = req.body.metaImage;
            var canonical = req.body.canonical;
            var textEndPage = req.body.textEndPage;


            // metaTitle: project.metaTitle,
            //     metaDescription: project.metaDescription,
            //     metaType: project.metaType,
            //     metaUrl: project.metaUrl,
            //     metaImage: project.metaImage,
            //     canonical: project.canonical


            if (district) {
                project.district = district;
            }

            if (city) {
                project.city = city;
            }

            if (isShowOverview) {
                project.isShowOverview = isShowOverview;
            }

            if (type) {
                project.type = type;
            }

            if (introImages) {
                project.introImages = introImages;
            }

            if (title) {
                project.title = title;
            }

            if (address) {
                project.address = address;
            }

            if (area) {
                project.area = area;
            }

            if (projectScale) {
                project.projectScale = projectScale;
            }

            if (price) {
                project.price = price;
            }

            if (deliveryHouseDate) {
                project.deliveryHouseDate = deliveryHouseDate;
            }

            if (constructionArea) {
                project.constructionArea = constructionArea;
            }

            if (descriptionInvestor) {
                project.descriptionInvestor = descriptionInvestor;
            }

            if (description) {
                project.description = description;
            }

            if (isShowLocationAndDesign) {
                project.isShowLocationAndDesign = isShowLocationAndDesign;
            }

            if (infrastructure) {
                project.infrastructure = infrastructure;
            }

            if (location) {
                project.location = location;
            }

            if (isShowGround) {
                project.isShowGround = isShowGround;
            }

            if (overallSchema) {
                project.overallSchema = overallSchema;
            }

            if (groundImages) {
                project.groundImages = groundImages;
            }

            if (isShowImageLibs) {
                project.isShowImageLibs = isShowImageLibs;
            }

            if (imageAlbums) {
                project.imageAlbums = imageAlbums;
            }

            if (isShowProjectProgress) {
                project.isShowProjectProgress = isShowProjectProgress;
            }

            if (projectProgressTitle) {
                project.projectProgressTitle = projectProgressTitle;
            }

            if (projectProgressStartDate) {
                project.projectProgressStartDate = projectProgressStartDate;
            }

            if (projectProgressEndDate) {
                project.projectProgressEndDate = projectProgressEndDate;
            }

            if (projectProgressDate) {
                project.projectProgressDate = projectProgressDate;
            }

            if (projectProgressImages) {
                project.projectProgressImages = projectProgressImages;
            }


            if (isShowTabVideo) {
                project.isShowTabVideo = isShowTabVideo;
            }

            if (video) {
                project.video = video;
            }

            if (isShowFinancialSupport) {
                project.isShowFinancialSupport = isShowFinancialSupport;
            }

            if (financialSupport) {
                project.financialSupport = financialSupport;
            }

            if (isShowInvestor) {
                project.isShowInvestor = isShowInvestor;
            }

            if (detailInvestor) {
                project.detailInvestor = detailInvestor;
            }

            if (status == global.STATUS_ACTIVE || global.STATUS_BLOCKED || global.STATUS_DELETE) {
                project.status = status;
            }

            if (!project.admin) {
                project.admin = [];
            }

            project.admin.push(accessToken.user);
            project = await project.save();


            if (status == global.STATUS_ACTIVE || global.STATUS_BLOCKED || global.STATUS_DELETE) {
                post.status = status;
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

            if (textEndPage) {
                post.textEndPage = textEndPage;
            }

            await post.save();
            return res.json({
                status: 1,
                data: project,
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
    //             status: global.STATUS_ACTIVE,
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
    //
    //         var page = req.query.page;
    //
    //         if (!page || page < 1) {
    //             page = 1;
    //         }
    //
    //         let projects = await ProjectModel.find({status: {$in: [global.STATUS_ACTIVE, global.STATUS_BLOCKED]}}).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
    //
    //         let results = await Promise.all(projects.map(async project => {
    //
    //             let post = await PostModel.findOne({content_id: project._id});
    //
    //
    //             let result = {
    //
    //                 status: project.status,
    //                 isShowOverview: project.isShowOverview,
    //                 type: project.type,
    //                 introImages: project.introImages,
    //                 title: project.title,
    //                 address: project.address,
    //                 area: project.area,
    //                 projectScale: project.projectScale,
    //                 price: project.price,
    //                 deliveryHouseDate: project.deliveryHouseDate,
    //                 constructionArea: project.constructionArea,
    //                 descriptionInvestor: project.descriptionInvestor,
    //                 description: project.description,
    //
    //                 isShowLocationAndDesign: project.isShowLocationAndDesign,
    //                 location: project.location,
    //                 infrastructure: project.infrastructure,
    //
    //                 isShowGround: project.isShowGround,
    //                 overallSchema: project.overallSchema,
    //                 groundImages: project.groundImages,
    //
    //                 isShowImageLibs: project.isShowImageLibs,
    //                 imageAlbums: project.imageAlbums,
    //
    //                 isShowProjectProgress: project.isShowProjectProgress,
    //                 projectProgressTitle: project.projectProgressTitle,
    //                 projectProgressStartDate: project.projectProgressStartDate,
    //                 projectProgressEndDate: project.projectProgressEndDate,
    //                 projectProgressDate: project.projectProgressDate,
    //                 projectProgressImages: project.projectProgressImages,
    //
    //                 isShowTabVideo: project.isShowTabVideo,
    //                 video: project.video,
    //
    //                 isShowFinancialSupport: project.isShowFinancialSupport,
    //                 financialSupport: project.financialSupport,
    //
    //                 isShowInvestor: project.isShowInvestor,
    //                 detailInvestor: project.detailInvestor,
    //
    //                 district: project.district,
    //                 city: project.city,
    //
    //
    //             };
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
    //                 result.textEndPage = post.textEndPage;
    //             }
    //
    //             return result;
    //
    //         }));
    //
    //
    //         let count = await ProjectModel.count({status: {$in: [global.STATUS_ACTIVE, global.STATUS_BLOCKED]}});
    //
    //         return res.json({
    //             status: 1,
    //             data: {
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

            var metaTitle = req.body.metaTitle;
            var metaDescription = req.body.metaDescription;
            var metaType = req.body.metaType;
            var metaUrl = req.body.metaUrl;
            var metaImage = req.body.metaImage;
            var canonical = req.body.canonical;
            var textEndPage = req.body.textEndPage;


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
            project.status = global.STATUS_ACTIVE;
            project.admin = [accessToken.user];

            project = await project.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_PROJECT;
            post.type = project.type;
            post.content_id = project._id;
            post.user = accessToken.user;

            post.metaTitle = metaTitle;
            post.metaDescription = metaDescription;
            post.metaType = metaType;
            post.metaUrl = metaUrl;
            post.metaImage = metaImage;
            post.canonical = canonical;
            post.textEndPage = textEndPage;

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

            post.status = global.STATUS_POST_ACTIVE;
            post.paymentStatus = global.STATUS_PAYMENT_FREE;

            await post.save();


            return res.json({
                status: 1,
                data: {},
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
