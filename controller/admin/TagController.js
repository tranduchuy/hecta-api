var TagModel = require('../../models/TagModel');
var _ = require('lodash');
var TokenModel = require('../../models/TokenModel');
var UserModel = require('../../models/UserModel');

var TagController = {

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
                message: 'id null error'
            });

        }

        var tag = await TagModel.findOne({_id: id, status: {$ne: global.STATUS.DELETE}});

        if (!tag) {
            return res.json({
                status: 0,
                data: {},
                message: 'tag not exist'
            });
        }

        let slug = req.body.slug;
        let metaTitle = req.body.metaTitle;
        let metaDescription = req.body.metaDescription;
        let metaType = req.body.metaType;
        let metaUrl = req.body.metaUrl;
        let metaImage = req.body.metaImage;
        let canonical = req.body.canonical;
        let textEndPage = req.body.textEndPage;

        let status = req.body.status;

        if (slug && slug.length > 0) {
            if (await TagModel.count({slug: slug, _id: {$ne: id}}) > 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'slug duplicate '
                });
            }

            tag.slug = slug;
        }

        if (status == global.STATUS.ACTIVE || status == global.STATUS.DELETE || status == global.STATUS.DELETE) {
            tag.status = status;
        }

        if (metaTitle) {
            tag.metaTitle = metaTitle;
        }

        if (metaDescription) {
            tag.metaDescription = metaDescription;
        }

        if (metaType) {
            tag.metaType = metaType;
        }

        if (metaUrl) {
            tag.metaUrl = metaUrl;
        }

        if (metaImage) {
            tag.metaImage = metaImage;
        }

        if (canonical) {
            tag.canonical = canonical;
        }

        if (textEndPage) {
            tag.textEndPage = textEndPage;
        }

        if (!tag.updatedBy) {
            tag.updatedBy = [];

        }
        tag.updatedBy.push(admin._id);
        tag = await tag.save();


        return res.json({
            status: 1,
            data: tag,
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


            var page = req.query.page;
            var slug = req.query.slug;
            var keyword = req.query.keyword;


            if (!page || page < 1) {
                page = 1;
            }

            var query = {status: {$ne: global.STATUS.DELETE}};

            if (slug) {
                query.slug = {"$regex": slug, "$options": "i"};
            }

            if (keyword) {
                query.keyword = {"$regex": keyword, "$options": "i"};
            }


            let tags = await
                TagModel.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await
                Promise.all(tags.map(async tag => {
                        return {
                            id: tag._id,
                            slug: tag.slug,
                            keyword: tag.keyword,
                            metaTitle: tag.metaTitle,
                            metaDescription: tag.metaDescription,
                            metaType: tag.metaType,
                            metaUrl: tag.metaUrl,
                            metaImage: tag.metaImage,
                            canonical: tag.canonical,
                            textEndPage: tag.textEndPage,
                        }
                    }
                ));
            let count = await TagModel.count(query);

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
                    message: 'id null error'
                });

            }

            let tag = await TagModel.findOne({_id: id, status: {$ne: global.STATUS.DELETE}});

            if (!tag) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'tag not exist'
                });
            }
            return res.json({
                status: 1,
                data: {
                    id: tag._id,
                    slug: tag.slug,
                    metaTitle: tag.metaTitle,
                    metaDescription: tag.metaDescription,
                    metaType: tag.metaType,
                    metaUrl: tag.metaUrl,
                    metaImage: tag.metaImage,
                    canonical: tag.canonical,
                    textEndPage: tag.textEndPage,
                    keyword: tag.keyword,

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
module.exports = TagController
