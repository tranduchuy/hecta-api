var UrlParamModel = require('../../models/UrlParamModel');
var _ = require('lodash');
var urlSlug = require('url-slug');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');

var CategoryController = {

    update: async function (req, res, next) {

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
                message: 'id null error'
            });

        }

        var category = await UrlParamModel.findOne({_id: id});

        if (!category) {
            return res.json({
                status: 0,
                data: {},
                message: 'post not exist'
            });
        }

        let url = req.body.url;
        let metaTitle = req.body.metaTitle;
        let metaDescription = req.body.metaDescription;
        let metaType = req.body.metaType;
        let metaUrl = req.body.metaUrl;
        let metaImage = req.body.metaImage;
        let canonical = req.body.canonical;
        let textEndPage = req.body.textEndPage;

        let status = req.body.status;

        if (url && url.length > 0) {
            if (await UrlParamModel.count({param: url}) > 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'url duplicate '
                });
            }

            category.url = url;
        }

        if (status == global.STATUS_ACTIVE || status == global.STATUS_DELETE || status == global.STATUS_DELETE) {
            category.status = status;
        }

        if (metaTitle) {
            category.metaTitle = metaTitle;
        }

        if (metaDescription) {
            category.metaDescription = metaDescription;
        }

        if (metaType) {
            category.metaType = metaType;
        }

        if (metaUrl) {
            category.metaUrl = metaUrl;
        }

        if (metaImage) {
            category.metaImage = metaImage;
        }

        if (canonical) {
            category.canonical = canonical;
        }

        if (textEndPage) {
            category.textEndPage = textEndPage;
        }

        if (!category.updatedBy) {
            category.updatedBy = [];

        }
        category.updatedBy.push(admin._id);
        category = await category.save();


        return res.json({
            status: 1,
            data: category,
            message: 'success !'
        });


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
            var url = req.query.url;


            if (!page || page < 1) {
                page = 1;
            }

            var query = {status: {$ne: global.STATUS_POST_DETELE}};

            if (url) {
                query.param = {"$regex": url, "$options": "i"};
            }


            let categories = await
                UrlParamModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await
                Promise.all(categories.map(async category => {


                        return {
                            id: category._id,
                            param: category.param,
                            metaTitle: category.metaTitle,
                            metaDescription: category.metaDescription,
                            metaType: category.metaType,
                            metaUrl: category.metaUrl,
                            metaImage: category.metaImage,
                            canonical: category.canonical,
                            textEndPage: category.textEndPage,
                        }
                    }
                ));
            let count = await UrlParamModel.count(query);

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

        catch
            (e) {
            return res.json({
                status: 0,
                data: {},
                message: 'unknown error : ' + e.message
            });
        }


    }

    ,


    detail: async function (req, res, next) {

        try {

            var token = req.headers.access_token;
            var accessToken = await TokenModel.findOne({token: token});

            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token invalid'
                });

            }

            var admin = await
                UserModel.findOne({
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
                    message: 'id null error'
                });

            }

            let category = await UrlParamModel.findOne({_id: id, status: {$ne: global.STATUS_DELETE}});

            if (!category) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'category not exist'
                });
            }

            return res.json({
                status: 1,
                data: {
                    id: category._id,
                    param: category.param,
                    metaTitle: category.metaTitle,
                    metaDescription: category.metaDescription,
                    metaType: category.metaType,
                    metaUrl: category.metaUrl,
                    metaImage: category.metaImage,
                    canonical: category.canonical,
                    textEndPage: category.textEndPage,

                    postType: category.postType,

                    formality: category.formality,
                    type: category.type,
                    city: category.city,
                    district: category.district,
                    ward: category.ward,
                    street: category.street,
                    project: category.project,
                    balconyDirection: category.balconyDirection,
                    bedroomCount: category.bedroomCount,
                    areaMax: category.areaMax,
                    areaMin: category.areaMin,
                    area: category.area,
                    priceMax: category.priceMax,
                    priceMin: category.priceMin,
                    price: category.price,

                    extra: category.extra,
                    text: category.text,
                },
                message: 'success'
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
module.exports = CategoryController
