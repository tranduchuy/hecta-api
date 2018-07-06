var UrlParamModel = require('../models/UrlParamModel');
var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');
var SaleModel = require('../models/SaleModel');
var NewsModel = require('../models/NewsModel');
var ProjectModel = require('../models/ProjectModel');
var _ = require('lodash');
var urlSlug = require('url-slug');

var SearchController = {


    addParamUrl: async function (req, res, next) {
        try {
            var text = req.body.text;
            var id = req.body.id;
            var postType = req.body.postType;
            var selectable = req.body.selectable;
            var level = req.body.level;


            var extra;
            if (selectable || level) {
                extra = {};
                if (selectable) {
                    extra.selectable = selectable == 'true';
                }
                if (level) {
                    extra.level = level;
                }
            }


            var urlParam = new UrlParamModel();

            urlParam.param = urlSlug(text);
            urlParam.postType = postType;
            urlParam.text = text;
            urlParam.type = id;
            if (extra) {
                urlParam.extra = extra;
            }
            urlParam = await urlParam.save();

            return res.json({
                status: 1,
                data: urlParam,
                message: 'request success !'
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

    filter: async function (req, res, next) {

        try {
            var postType = req.body.postType;
            var formality = req.body.formality;
            var type = req.body.type;
            var city = req.body.city;
            var district = req.body.district;
            var ward = req.body.ward;
            var street = req.body.street;
            var project = req.body.project;
            var balconyDirection = req.body.balconyDirection;
            var bedroomCount = req.body.bedroomCount;
            var areaMax = req.body.areaMax;
            var areaMin = req.body.areaMin;
            var area = req.body.area;
            var priceMax = req.body.priceMax;
            var priceMin = req.body.priceMin;
            var price = req.body.price;


            if (postType == 'null') {
                postType = undefined;
            }

            if (formality == 'null' || formality == undefined) {
                formality = undefined;
            } else {
                formality = formality.value
            }
            if (type == 'null' || type == undefined) {
                type = undefined;
            } else {
                type = type.value
            }
            if (city == 'null' || city == undefined) {
                city = undefined;
            } else {
                city = city.value
            }
            if (district == 'null' || district == undefined) {
                district = undefined;
            } else {
                district = district.value
            }
            if (ward == 'null' || ward == undefined) {
                ward = undefined;
            } else {
                ward = ward.value
            }
            if (street == 'null' || street == undefined) {
                street = undefined;
            } else {
                street = street.value
            }
            if (project == 'null' || project == undefined) {
                project = undefined;
            } else {
                project = project.value
            }
            if (balconyDirection == 'null' || balconyDirection == undefined) {
                balconyDirection = undefined;
            } else {
                balconyDirection = balconyDirection.value
            }
            if (bedroomCount == 'null' || bedroomCount == undefined) {
                bedroomCount = undefined;
            } else {
                bedroomCount = bedroomCount.value
            }
            if (areaMax == 'null' || areaMax == undefined) {
                areaMax = undefined;
            } else {
                areaMax = areaMax.value
            }
            if (areaMin == 'null' || areaMin == undefined) {
                areaMin = undefined;
            } else {
                areaMin = areaMin.value
            }
            if (area == 'null' || area == undefined) {
                area = undefined;
            } else {
                area = area.value
            }
            if (priceMax == 'null' || priceMax == undefined) {
                priceMax = undefined;
            } else {
                priceMax = priceMax.value
            }
            if (priceMin == 'null' || priceMin == undefined) {
                priceMin = undefined;
            } else {
                priceMin = priceMin.value
            }
            if (price == 'null' || price == undefined) {
                price = undefined;
            } else {
                price = price.value
            }

            let query = {
                postType: postType,
                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                // areaMax: areaMax,
                // areaMin: areaMin,
                area: area,
                // priceMax: priceMax,
                // priceMin: priceMin,
                price: price
            };


            var cats = await UrlParamModel.find(query);
            var mainUrl = global.PARAM_NOT_FOUND;

            switch (postType) {
                case global.POST_TYPE_BUY :
                    mainUrl = global.PARAM_NOT_FOUND_BUY;
                    break;
                case global.POST_TYPE_SALE :
                    mainUrl = global.PARAM_NOT_FOUND_SALE;
                    break;
                case global.POST_TYPE_NEWS :
                    mainUrl = global.PARAM_NOT_FOUND_NEWS;
                    break;
                case global.POST_TYPE_PROJECT :
                    mainUrl = global.PARAM_NOT_FOUND_PROJECT;
                    break;

            }

            cats.forEach(cat => {


                if (cat.areaMax == areaMax && cat.areaMin == areaMin && cat.priceMax == priceMax && cat.priceMin == priceMin) {
                    return res.json({
                        status: 1,
                        data: {url: cat.param},
                        message: 'request success 1 !'
                    });
                }

                if (cat.areaMax == undefined && cat.areaMin == undefined && cat.priceMax == undefined && cat.priceMin == undefined) {
                    mainUrl = cat.url;
                }


            });


            var url = mainUrl + ((priceMax || priceMin) ? ('-gia' + (priceMin ? ('-tu-' + priceMin) : '') + (priceMax ? ('-den-' + priceMax) : '')) : '') + ((areaMax || areaMin) ? ('-dien-tich' + (areaMin ? ('-tu-' + areaMin) : '') + (areaMax ? ('-den-' + areaMax) : '')) : '');

            var param = await UrlParamModel.findOne({param: url});
            while (param) {
                url = url + '-';
                param = await UrlParamModel.findOne({param: url});
            }

            var cat = new UrlParamModel({
                postType: postType,
                formality: formality,
                type: type,
                city: city,
                district: district,
                ward: ward,
                street: street,
                project: project,
                balconyDirection: balconyDirection,
                bedroomCount: bedroomCount,
                areaMax: areaMax,
                areaMin: areaMin,
                area: area,
                priceMax: priceMax,
                priceMin: priceMin,
                price: price,
                param: url
            });


            cat = await cat.save();

            return res.json({
                status: 1,
                data: {url: cat.param},
                message: 'request success 2!'
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


    , search: async function (req, res, next) {


        try {

            var url = req.query.url;
            var page = req.query.page;

            if (!page || page < 1) {
                page = 1;
            }

            if (!url || url.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid'
                });

            }


            var params = url.trim().split('/');

            if (params.length == 0 || params.length > 2) {

                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid'
                });
            }


            let cat = await UrlParamModel.findOne({param: params[0]});
            let postType;

            if (params[0] == global.PARAM_NOT_FOUND_SALE) {
                postType = global.POST_TYPE_SALE;
            }
            else if (params[0] == global.PARAM_NOT_FOUND_BUY) {
                postType = global.POST_TYPE_BUY;
            }
            else if (params[0] == global.PARAM_NOT_FOUND_PROJECT) {
                postType = global.POST_TYPE_PROJECT;
            }
            else if (params[0] == global.PARAM_NOT_FOUND_NEWS) {
                postType = global.POST_TYPE_NEWS;
            }
            else if (cat) {
                postType = cat.postType;
            }
            else {
                return res.json({
                    status: 0,
                    data: {},
                    message: params[0] + ' not found'
                });
            }


            let query = {status: global.STATUS_POST_ACTIVE};

            if (cat) {
                if (cat.formality) {
                    query.formality = cat.formality;
                }
                if (cat.type) {
                    query.type = cat.type;
                }
                if (cat.city) {
                    query.city = cat.city;
                }
                if (cat.district) {
                    query.district = cat.district;
                }
                if (cat.ward) {
                    query.ward = cat.ward;
                }
                if (cat.street) {
                    query.street = cat.street;
                }
                if (cat.project) {
                    query.project = cat.project;
                }
                if (cat.balconyDirection) {
                    query.balconyDirection = cat.balconyDirection;
                }
                if (cat.bedroomCount) {
                    query.bedroomCount = cat.bedroomCount;
                }
                if (cat.area) {
                    query.area = cat.area;
                }
                if (cat.price) {
                    query.price = cat.price;
                }
            }


            if (params.length == 1) {

                let model;

                switch (postType) {
                    case global.POST_TYPE_SALE :
                        model = SaleModel;
                        break;
                    case global.POST_TYPE_BUY :
                        model = BuyModel;
                        break;
                    case global.POST_TYPE_PROJECT :
                        model = ProjectModel;
                        break;
                    case global.POST_TYPE_NEWS :
                        model = NewsModel;
                        break;
                    default :
                        model = SaleModel;
                        break;
                }

                let data = await model.find(query).sort({date: -1}).skip((page - 1) * global.PAGE_SIZE).limit(global.PAGE_SIZE);
                let results = await Promise.all(data.map(async item => {

                    let post = await PostModel.findOne({content_id: item._id});


                    if (postType == global.POST_TYPE_SALE) {

                        let sale = item;


                        return {

                            formality: sale.formality,
                            title: sale.title,
                            description: sale.description,
                            city: sale.city,
                            district: sale.district,
                            price: sale.price,
                            unit: sale.unit,
                            area: sale.area,
                            date: sale.date,
                            images: sale.images,
                            address: sale.address,

                            url: post.url,
                            type: post.type,
                            id: post._id,



                        };
                    }
                    else if (postType == global.POST_TYPE_BUY) {


                        let buy = item;

                        return {

                            title: buy.title,
                            formality: buy.formality,
                            description: buy.description,
                            city: buy.city,
                            district: buy.district,
                            priceMin: buy.priceMin,
                            priceMax: buy.priceMax,
                            areaMin: buy.areaMin,
                            areaMax: buy.areaMax,
                            unit: buy.unit,
                            date: buy.date,
                            images: buy.images,
                            address: buy.address,

                            url: post.url,
                            type: post.type,
                            id: post._id,

                            priority: post.priority,
                            status : post.status,
                            paymentStatus : post.paymentStatus
                        };
                    }

                    else if (postType == global.POST_TYPE_NEWS) {

                        let project = item;

                        return {
                            title: project.title,
                            description: project.description,
                            address: project.address,
                            price: project.price,
                            area: project.area,
                            descriptionInvestor: project.descriptionInvestor,
                            projectProgressTitle: project.projectProgressTitle,
                            introImages: project.introImages,
                            url: post.url
                        };

                    } else {
                        let news = item;

                        return {
                            title: news.title,
                            content: news.content,
                            cate: news.cate,
                            image: news.image,
                            url: post.url,
                            date: news.date,
                            description: news.description

                        };

                    }


                }));


                let count = await model.count(query);

                return res.json({
                    status: 1,
                    type: postType,
                    isList: true,
                    params: query,
                    data: {
                        items: results,
                        page: page,
                        total: _.ceil(count / global.PAGE_SIZE)
                    },
                    message: 'request success '
                });


            }


            let post = await PostModel.findOne({url: url});
            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist'
                });
            }

            let model;

            switch (postType) {
                case global.POST_TYPE_SALE :
                    model = SaleModel;
                    break;
                case global.POST_TYPE_BUY :
                    model = BuyModel;
                    break;
                case global.POST_TYPE_PROJECT :
                    model = ProjectModel;
                    break;

                case global.POST_TYPE_NEWS :
                    model = NewsModel;
                    break;
                default :
                    model = SaleModel;
                    break;
            }

            let content = await model.findOne({_id: post.content_id});


            if (!content) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });


            }

            if (postType == global.POST_TYPE_SALE) {

                return res.json({
                    type: postType,
                    isList: false,
                    params: query,
                    status: 1,
                    data: {
                        priority: post.priority,
                        url: post.url,
                        id: content._id,
                        title: content.title,
                        formality: content.formality,
                        type: content.type,
                        city: content.city,
                        district: content.district,
                        ward: content.ward,
                        street: content.street,
                        project: content.project,
                        area: content.area,
                        price: content.price,
                        unit: content.unit,
                        address: content.address,
                        keywordList: content.keywordList,
                        description: content.description,
                        streetWidth: content.streetWidth,
                        frontSize: content.frontSize,
                        direction: content.direction,
                        balconyDirection: content.balconyDirection,
                        floorCount: content.floorCount,
                        bedroomCount: content.bedroomCount,
                        toiletCount: content.toiletCount,
                        furniture: content.furniture,
                        images: content.images,
                        contactName: content.contactName,
                        contactAddress: content.contactAddress,
                        contactPhone: content.contactPhone,
                        contactMobile: content.contactMobile,
                        contactEmail: content.contactEmail,
                        date: content.date,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType
                    },
                    message: 'request success'
                });
            }
            else if (postType == global.POST_TYPE_BUY) {

                return res.json({
                    status: 1,
                    type: postType,
                    isList: false,
                    params: query,
                    data: {
                        priority: post.priority,
                        url: post.url,
                        id: content._id,
                        title: content.title,
                        description: content.description,
                        keywordList: content.keywordList,
                        formality: content.formality,
                        type: content.type,
                        city: content.city,
                        district: content.district,
                        ward: content.ward,
                        street: content.street,
                        project: content.project,
                        areaMin: content.areaMin,
                        areaMax: content.areaMax,
                        priceMin: content.priceMin,
                        priceMax: content.priceMax,
                        unit: content.unit,
                        address: content.address,
                        images: content.images,
                        contactName: content.contactName,
                        contactAddress: content.contactAddress,
                        contactPhone: content.contactPhone,
                        contactMobile: content.contactMobile,
                        contactEmail: content.contactEmail,
                        receiveMail: content.receiveMail,
                        date: content.date,
                        to: post.to,
                        from: post.from,
                        priority: post.priority,
                        postType: post.postType
                    },
                    message: 'request success'
                });
            }
            else if (postType == global.POST_TYPE_PROJECT) {
                return res.json({
                    status: 1,
                    type: postType,
                    isList: false,
                    params: query,
                    data: {
                        url: post.url,
                        id: content._id,
                        postType: post.postType,

                        isShowOverview: content.isShowOverview,
                        type: content.type,
                        introImages: content.introImages,
                        title: content.title,
                        address: content.address,
                        area: content.area,
                        projectScale: content.projectScale,
                        price: content.price,
                        deliveryHouseDate: content.deliveryHouseDate,
                        constructionArea: content.constructionArea,
                        descriptionInvestor: content.descriptionInvestor,
                        description: content.description,

                        isShowLocationAndDesign: content.isShowLocationAndDesign,
                        location: content.location,
                        infrastructure: content.infrastructure,

                        isShowGround: content.isShowGround,
                        overallSchema: content.overallSchema,
                        groundImages: content.groundImages,

                        isShowImageLibs: content.isShowImageLibs,
                        imageAlbums: content.imageAlbums,

                        isShowProjectProgress: content.isShowProjectProgress,
                        projectProgressTitle: content.projectProgressTitle,
                        projectProgressStartDate: content.projectProgressStartDate,
                        projectProgressEndDate: content.projectProgressEndDate,
                        projectProgressDate: content.projectProgressDate,
                        projectProgressImages: content.projectProgressImages,

                        isShowTabVideo: content.isShowTabVideo,
                        video: content.video,

                        isShowFinancialSupport: content.isShowFinancialSupport,
                        financialSupport: content.financialSupport,

                        isShowInvestor: content.isShowInvestor,
                        detailInvestor: content.detailInvestor,

                        district: content.district,
                        city: content.city
                    },
                    message: 'request success'
                });


            } else {
                return res.json({
                    status: 1,
                    type: postType,
                    isList: false,
                    params: query,
                    data: {
                        title: content.title,
                        content: content.content,
                        cate: content.cate,
                        image: content.image,
                        url: post.url,
                        date: content.date,
                        description: content.description

                    },
                    message: 'request success'
                });


            }

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
module.exports = SearchController
