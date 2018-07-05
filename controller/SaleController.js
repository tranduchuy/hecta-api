var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');
var TagModel = require('../models/TagModel');
var _ = require('lodash');
var TokenModel = require('../models/TokenModel');
var UrlParamModel = require('../models/UrlParamModel');
var urlSlug = require('url-slug');
var SaleController = {


    detail: async function (req, res, next) {
        let id = req.params.id;
        try {

            if (!id || id.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id null error'
                });

            }

            let sale = await SaleModel.findOne({_id: id});

            if (!sale) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });
            }


            return res.json({
                status: 1,
                data: {
                    id: sale._id,
                    title: sale.title,
                    formality: sale.formality,
                    type: sale.type,
                    city: sale.city,
                    district: sale.district,
                    ward: sale.ward,
                    street: sale.street,
                    project: sale.project,
                    area: sale.area,
                    price: sale.price,
                    unit: sale.unit,
                    address: sale.address,
                    keywordList: sale.keywordList,
                    description: sale.description,
                    streetWidth: sale.streetWidth,
                    frontSize: sale.frontSize,
                    direction: sale.direction,
                    balconyDirection: sale.balconyDirection,
                    floorCount: sale.floorCount,
                    bedroomCount: sale.bedroomCount,
                    toiletCount: sale.toiletCount,
                    furniture: sale.furniture,
                    images: sale.images,
                    contactName: sale.contactName,
                    contactAddress: sale.contactAddress,
                    contactPhone: sale.contactPhone,
                    contactMobile: sale.contactMobile,
                    contactEmail: sale.contactEmail,
                    date: sale.date
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


    }
    ,
    list: async function (req, res, next) {

        var page = req.query.page;

        if (!page || page < 1) {
            page = 1;
        }

        try {

            let date = Date.now();

            let posts = await PostModel.find({
                type: global.POST_TYPE_SALE
                , to: {$gt: date}
                , from: {$lt: date}
            }).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);


            let results = await Promise.all(posts.map(async post => {


                let sale = await SaleModel.findOne({_id: post.content_id});


                return await
                    // {sale, post};
                    {
                        id: post._id,
                        formality: sale.formality,
                        title: sale.title,
                        description: sale.description,
                        city: sale.city,
                        district: sale.district,
                        price: sale.price,
                        unit: sale.unit,
                        area: sale.area,
                        date: sale.date,
                        priority: post.priority,
                        images: sale.images,
                        address: sale.address,
                    };


            }));


            let count = await PostModel.count({
                type: global.POST_TYPE_SALE
                , to: {$gt: date}
                , from: {$lt: date}
            });

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

        var token = req.headers.access_token;


        var title = req.body.title;

        var formality = req.body.formality;
        var type = req.body.type;
        var city = req.body.city;
        var district = req.body.district;
        var ward = req.body.ward;
        var street = req.body.street;
        var project = req.body.project;
        var area = req.body.area;
        var price = req.body.price;
        var unit = req.body.unit;
        var address = req.body.address;

        var keywordList = req.body.keywordList;

        var description = req.body.description;

        var streetWidth = req.body.streetWidth;
        var frontSize = req.body.frontSize;
        var direction = req.body.direction;
        var balconyDirection = req.body.balconyDirection;
        var floorCount = req.body.floorCount;
        var bedroomCount = req.body.bedroomCount;
        var toiletCount = req.body.toiletCount;
        var furniture = req.body.furniture;

        var images = req.body.images;

        var contactName = req.body.contactName;
        var contactAddress = req.body.contactAddress;
        var contactPhone = req.body.contactPhone;
        var contactMobile = req.body.contactMobile;
        var contactEmail = req.body.contactEmail;

        var priority = req.body.priority;

        var from = req.body.from;
        var to = req.body.to;

        var captchaToken = req.body.captchaToken;

        try {
            if (!title || title.length < 30 || title.length > 99) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'title : "' + title + '" is invalid'
                });
            }

            if (!formality || formality.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'formality : "' + formality + '" is invalid'
                });
            }

            if (!type || type.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'type : "' + type + '" is invalid'
                });
            }

            if (!city || city.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'city : "' + city + '" is invalid'
                });
            }

            if (!district || district.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'district : "' + district + '" is invalid'
                });
            }

            if (!description || description.length < 30 || description.length > 3000) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'description : "' + description + '" is invalid'
                });
            }

            if (!contactMobile || contactMobile.length < 8 || contactMobile.length > 11) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'contactMobile : "' + contactMobile + '" is invalid'
                });
            }

            if (!captchaToken || captchaToken.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'captchaToken : "' + captchaToken + '" is invalid'
                });
            }


            var sale = new SaleModel();

            sale.title = title;

            sale.formality = formality;
            sale.type = type;
            sale.city = city;
            sale.district = district;
            sale.ward = ward;
            sale.street = street;
            sale.project = project;
            sale.area = area;
            sale.price = price;
            sale.unit = unit;
            sale.address = address;

            sale.keywordList = keywordList;

            sale.description = description;

            sale.frontSize = frontSize;
            sale.streetWidth = streetWidth;
            sale.direction = direction;
            sale.balconyDirection = balconyDirection;
            sale.floorCount = floorCount;
            sale.bedroomCount = bedroomCount;
            sale.toiletCount = toiletCount;
            sale.furniture = furniture;

            sale.images = images;
            sale.contactName = contactName;
            sale.contactAddress = contactAddress;
            sale.contactPhone = contactPhone;
            sale.contactMobile = contactMobile;
            sale.contactEmail = contactEmail;

            sale = await sale.save();

            var post = new PostModel();

            post.postType = global.POST_TYPE_SALE;
            post.type = sale.type;
            post.content_id = sale._id;
            post.priority = priority;
            post.from = from;
            post.to = to;
            post.formality = sale.formality;

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

            let queryParams = {
                postType: global.POST_TYPE_SALE
            };

            if (formality) {
                queryParams.formality = formality;
            }

            if (type) {
                queryParams.type = type;
            }

            if (city) {
                queryParams.city = city;
            }

            if (district) {
                queryParams.district = district;
            }

            if (ward) {
                queryParams.ward = ward;
            }


            if (street) {
                queryParams.street = street;
            }
            if (project) {
                queryParams.project = project;
            }


            if (balconyDirection) {
                queryParams.balconyDirection = balconyDirection;
            }

            if (bedroomCount) {
                queryParams.bedroomCount = bedroomCount;
            }

            if (area) {
                queryParams.area = area;
            }

            if (price) {
                queryParams.price = price;
            }


            let param = await UrlParamModel.findOne(queryParams);


            let mainUrl = !param ? global.PARAM_NOT_FOUND_SALE : param.param;

            post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();

            post = await post.save();

            if (keywordList && keywordList.length > 0) {
                keywordList.forEach(async key => {

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
                    }

                    var tag = await TagModel.findOne({slug: slug});

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                            posts: []
                        });
                    }

                    tag.refresh = Date.now();
                    tag.posts.push(post._id);

                    await tag.save();
                })
            }


            return res.json({
                status: 1,
                data: post,
                message: 'request  post sale success !'
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

    ,
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


            var sale = await SaleModel.findOne({_id: id});


            if (!sale) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'sale not exist '
                });
            }

            let post = await PostModel.findOne({content_id: sale._id});

            if (!post || post.user != accessToken.user) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'user does not have permission !'
                });
            }


            var title = req.body.title;

            var formality = req.body.formality;
            var type = req.body.type;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var street = req.body.street;
            var project = req.body.project;
            var area = req.body.area;
            var price = req.body.price;
            var unit = req.body.unit;
            var address = req.body.address;

            var keywordList = req.body.keywordList;

            var description = req.body.description;

            var streetWidth = req.body.streetWidth;
            var frontSize = req.body.frontSize;
            var direction = req.body.direction;
            var balconyDirection = req.body.balconyDirection;
            var floorCount = req.body.floorCount;
            var bedroomCount = req.body.bedroomCount;
            var toiletCount = req.body.toiletCount;
            var furniture = req.body.furniture;

            var images = req.body.images;

            var contactName = req.body.contactName;
            var contactAddress = req.body.contactAddress;
            var contactPhone = req.body.contactPhone;
            var contactMobile = req.body.contactMobile;
            var contactEmail = req.body.contactEmail;

            var priority = req.body.priority;

            var status = req.body.status;

            var from = req.body.from;
            var to = req.body.to;
            var paramsX = req.body.params;


            if (title) {
                sale.title = title;
            }

            if (formality) {
                sale.formality = formality;
            }
            if (type) {
                sale.type = type;
            }
            if (city) {
                sale.city = city;
            }
            if (district) {
                sale.district = district;
            }
            if (ward) {
                sale.ward = ward;
            }
            if (street) {
                sale.street = street;
            }
            if (project) {
                sale.project = project;
            }
            if (area) {
                sale.area = area;
            }
            if (price) {
                sale.price = price;
            }
            if (unit) {
                sale.unit = unit;
            }
            if (address) {
                sale.address = address;
            }

            if (keywordList) {
                sale.keywordList = keywordList;
            }

            if (description) {
                sale.description = description;
            }

            if (streetWidth) {
                sale.streetWidth = streetWidth;
            }
            if (frontSize) {
                sale.frontSize = frontSize;
            }
            if (direction) {
                sale.direction = direction;
            }
            if (balconyDirection) {
                sale.balconyDirection = balconyDirection;
            }
            if (floorCount) {
                sale.floorCount = floorCount;
            }
            if (bedroomCount) {
                sale.bedroomCount = bedroomCount;
            }
            if (toiletCount) {
                sale.toiletCount = toiletCount;
            }
            if (furniture) {
                sale.furniture = furniture;
            }

            if (images) {
                sale.images = images;
            }

            if (contactName) {
                sale.contactName = contactName;
            }
            if (contactAddress) {
                sale.contactAddress = contactAddress;
            }
            if (contactPhone) {
                sale.contactPhone = contactPhone;
            }
            if (contactMobile) {
                sale.contactMobile = contactMobile;
            }
            if (contactEmail) {
                sale.contactEmail = contactEmail;
            }

            if (priority) {
                sale.priority = priority;
            }

            if (status != undefined) {
                sale.status = status;
            }


            sale = await sale.save();


            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_SALE,

                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                area: area,
                price: price
            });


            if (title) {
                let mainUrl = !param ? global.PARAM_NOT_FOUND_SALE : param.param;
                post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();
            }
            post.type = sale.type;
            post.priority = sale.priority;

            if (from) {
                post.from = from;
            }

            if (to) {
                post.to = to;
            }

            await post.save();

            if (keywordList && keywordList.length > 0) {
                keywordList.forEach(async key => {

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
                    }

                    var tag = await TagModel.findOne({slug: slug});

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                            posts: []
                        });
                    }

                    tag.refresh = Date.now();
                    tag.posts.push(post._id);

                    await tag.save();
                })
            }


            return res.json({
                status: 1,
                data: sale,
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
    updateAdmin: async function (req, res, next) {


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


            var sale = await SaleModel.findOne({_id: id});

            if (!sale) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'sale not exist '
                });
            }


            var title = req.body.title;

            var formality = req.body.formality;
            var type = req.body.type;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var street = req.body.street;
            var project = req.body.project;
            var area = req.body.area;
            var price = req.body.price;
            var unit = req.body.unit;
            var address = req.body.address;

            var keywordList = req.body.keywordList;

            var description = req.body.description;

            var streetWidth = req.body.streetWidth;
            var frontSize = req.body.frontSize;
            var direction = req.body.direction;
            var balconyDirection = req.body.balconyDirection;
            var floorCount = req.body.floorCount;
            var bedroomCount = req.body.bedroomCount;
            var toiletCount = req.body.toiletCount;
            var furniture = req.body.furniture;

            var images = req.body.images;

            var contactName = req.body.contactName;
            var contactAddress = req.body.contactAddress;
            var contactPhone = req.body.contactPhone;
            var contactMobile = req.body.contactMobile;
            var contactEmail = req.body.contactEmail;

            var priority = req.body.priority;

            var status = req.body.status;

            var from = req.body.from;
            var to = req.body.to;


            if (title) {
                sale.title = title;
            }

            if (formality) {
                sale.formality = formality;
            }
            if (type) {
                sale.type = type;
            }
            if (city) {
                sale.city = city;
            }
            if (district) {
                sale.district = district;
            }
            if (ward) {
                sale.ward = ward;
            }
            if (street) {
                sale.street = street;
            }
            if (project) {
                sale.project = project;
            }
            if (area) {
                sale.area = area;
            }
            if (price) {
                sale.price = price;
            }
            if (unit) {
                sale.unit = unit;
            }
            if (address) {
                sale.address = address;
            }

            if (keywordList) {
                sale.keywordList = keywordList;
            }

            if (description) {
                sale.description = description;
            }

            if (streetWidth) {
                sale.streetWidth = streetWidth;
            }
            if (frontSize) {
                sale.frontSize = frontSize;
            }
            if (direction) {
                sale.direction = direction;
            }
            if (balconyDirection) {
                sale.balconyDirection = balconyDirection;
            }
            if (floorCount) {
                sale.floorCount = floorCount;
            }
            if (bedroomCount) {
                sale.bedroomCount = bedroomCount;
            }
            if (toiletCount) {
                sale.toiletCount = toiletCount;
            }
            if (furniture) {
                sale.furniture = furniture;
            }

            if (images) {
                sale.images = images;
            }

            if (contactName) {
                sale.contactName = contactName;
            }
            if (contactAddress) {
                sale.contactAddress = contactAddress;
            }
            if (contactPhone) {
                sale.contactPhone = contactPhone;
            }
            if (contactMobile) {
                sale.contactMobile = contactMobile;
            }
            if (contactEmail) {
                sale.contactEmail = contactEmail;
            }

            if (priority) {
                sale.priority = priority;
            }

            if (status != undefined) {
                sale.status = status;
            }


            sale = await sale.save();

            let post = await PostModel.findOne({content_id: sale._id})


            let param = await UrlParamModel.findOne({
                postType: global.POST_TYPE_SALE,

                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                area: area,
                price: price
            });


            if (title) {
                let mainUrl = !param ? global.PARAM_NOT_FOUND_SALE : param.param;
                post.url = mainUrl + '/' + urlSlug(title) + '-' + Date.now();
            }
            post.type = sale.type;
            post.priority = sale.priority;

            if (from) {
                post.from = from;
            }

            if (to) {
                post.to = to;
            }


            await post.save();

            if (keywordList && keywordList.length > 0) {
                keywordList.forEach(async key => {

                    var slug = urlSlug(key);

                    if (!slug) {
                        return;
                    }

                    var tag = await TagModel.findOne({slug: slug});

                    if (!tag) {
                        tag = new TagModel({
                            slug: slug,
                            keyword: key,
                            posts: []
                        });
                    }

                    tag.refresh = Date.now();
                    tag.posts.push(post._id);

                    await tag.save();
                })
            }


            return res.json({
                status: 1,
                data: sale,
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

    }
}
module.exports = SaleController
