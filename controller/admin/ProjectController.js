const ProjectModel = require('../../models/ProjectModel');
const PostModel = require('../../models/PostModel');
const _ = require('lodash');
const TokenModel = require('../../models/TokenModel');
const UserModel = require('../../models/UserModel');
const UrlParamModel = require('../../models/UrlParamModel');
const urlSlug = require('url-slug');
const log4js = require('log4js');
const mongoose = require('mongoose');
const logger = log4js.getLogger('Controllers');
const HttpCode = require('../../config/http-code');
const ImageService = require('../../services/ImageService');

const ProjectController = {
    typeList: async function (req, res, next) {
        try {

            var token = req.headers.accesstoken;
            var accessToken = await TokenModel.findOne({token: token});

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
        logger.info('AdminProjectController::Update is called');
        
        try {
            const admin = req.user;
            if ([global.USER_ROLE_MASTER, global.USER_ROLE_ADMIN].indexOf(admin.role) === -1) {
                logger.error('AdminProjectController::Update::error Permission denied', admin.token);
                return next(new Error('Permission denied'));
            }

            let id = req.params.id;
            if (!id || id.length === 0) {
                logger.error('AdminProjectController::Update::error Invalid project id', id);
                return next(new Error('Invalid project id'));
            }

            const post = await PostModel.findOne({_id: id});

            if (!post) {
                logger.error('AdminProjectController::Update::error Post of project not exist', id);
                return next(new Error('Post of project not exist'));
            }

            let project = await ProjectModel.findOne({_id: post.contentId});

            if (!project) {
                logger.error('AdminProjectController::Update::error Project not exist. Project Id: ', post.contentId);
                return next(new Error('Project not exist'));
            }

            const {status} = req.body;

            // update images
            const imagesProperties = ['introImages', 'overallSchema', 'groundImages', 'imageAlbums', 'projectProgressImages'];
            imagesProperties.forEach((imgPropNm) => {
                if (req.body[imgPropNm]) {
                    ImageService.putUpdateImage(
                        project[imgPropNm].map(o => o.id),
                        req.body[imgPropNm].map(n => n.id)
                    );
                }
            });

            const projectProperties = ['isShowOverview', 'type', 'introImages', 'title', 'address', 'area', 'projectScale', 'price', 'deliveryHouseDate', 'constructionArea', 'descriptionInvestor', 'description', 'isShowLocationAndDesign', 'infrastructure', 'location', 'isShowGround', 'overallSchema', 'groundImages', 'isShowImageLibs', 'imageAlbums', 'isShowProjectProgress', 'projectProgressTitle', 'projectProgressStartDate', 'projectProgressEndDate', 'projectProgressDate', 'projectProgressImages', 'isShowTabVideo', 'video', 'isShowFinancialSupport', 'financialSupport', 'isShowInvestor', 'detailInvestor', 'district', 'city', 'status', 'metaTitle', 'metaDescription', 'metaType', 'metaUrl', 'metaImage', 'canonical', 'textEndPage'];
            const postProperties = ['metaTitle', 'metaDescription', 'metaType', 'metaUrl', 'metaImage', 'canonical', 'textEndPage'];

            projectProperties.forEach(field => {
               project[field] = req.body[field] || project[field];
            });

            if (status === global.STATUS.ACTIVE || status === global.STATUS.BLOCKED || status === global.STATUS.DELETE) {
                project.status = status;
                post.status = status;
            }

            if (!project.admin) {
                project.admin = [];
            }

            project.admin.push(new mongoose.Types.ObjectId(admin._id));
            project = await project.save();

            // update post info
            postProperties.forEach(field => {
                post[field] = req.body[field] || post[field];
            });

            await post.save();
            return res.json({
                status: HttpCode.SUCCESS,
                data: project,
                message: 'Update success'
            });
        } catch (e) {
            logger.error('AdminProjectController::update::error', e);
            return next(e);
        }
    },

    add: async function (req, res, next) {

        try {

            var token = req.headers.accesstoken;
            var accessToken = await TokenModel.findOne({token: token});

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
    
            var project = new ProjectModel();
    
            if (createdByType) {
                const countTitle = await ProjectModel.findOne({title: req.body.title});
                if (countTitle > 0){
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'Crawler duplicate title'
                    });
                }
            }

            var isShowOverview = req.body.isShowOverview;

            var type = req.body.type;
            var introImages = req.body.introImages;
            ImageService.postConfirmImage(introImages.map(intro => {
                return intro.id;
            }));

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
            ImageService.postConfirmImage(overallSchema.map(intro => {
                return intro.id;
            }));

            var groundImages = req.body.groundImages;
            ImageService.postConfirmImage(groundImages.map(intro => {
                return intro.id;
            }));

            var isShowImageLibs = req.body.isShowImageLibs;
            var imageAlbums = req.body.imageAlbums;
            ImageService.postConfirmImage(imageAlbums.map(intro => {
                return intro.id;
            }));


            var isShowProjectProgress = req.body.isShowProjectProgress;
            var projectProgressTitle = req.body.projectProgressTitle;
            var projectProgressStartDate = req.body.projectProgressStartDate;
            var projectProgressEndDate = req.body.projectProgressEndDate;
            var projectProgressDate = req.body.projectProgressDate;
            var projectProgressImages = req.body.projectProgressImages;
            ImageService.postConfirmImage(projectProgressImages.map(intro => {
                return intro.id;
            }));


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
            var createdByType = req.body.createdByType;


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
            project.status = global.STATUS.ACTIVE;
            project.admin = [accessToken.user];

            if (createdByType) {
                project.createdByType = createdByType;
            } else {
                project.createdByType = global.CREATED_BY.HAND;
            }

            project = await project.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_PROJECT;
            post.type = project.type;
            post.contentId = new mongoose.Types.ObjectId(project._id);
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

                param = new UrlParamModel({
                    postType: global.POST_TYPE_PROJECT,
                    param: 'project-' + Date.now(),
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
                param = await param.save();

            }
            var url = urlSlug(title);

            var count = await PostModel.find({url: new RegExp("^" + url)});

            if (count > 0) {
                url += ('-' + count);
            }

            post.url = url;
            post.params = param._id;

            post.status = global.STATUS.ACTIVE;
            post.paymentStatus = global.STATUS.PAYMENT_FREE;

            await post.save();


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
};

module.exports = ProjectController;
