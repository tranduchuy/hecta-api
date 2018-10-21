var UrlParamModel = require('../models/UrlParamModel');
var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');
var SaleModel = require('../models/SaleModel');
var NewsModel = require('../models/NewsModel');
var ProjectModel = require('../models/ProjectModel');
var TagModel = require('../models/TagModel');
var _ = require('lodash');
var urlSlug = require('url-slug');

var SearchController = {


    // addParamUrl: async function (req, res, next) {
    //     try {
    //         var text = req.body.text;
    //         var id = req.body.id;
    //         var postType = req.body.postType;
    //         var selectable = req.body.selectable;
    //         var level = req.body.level;
    //
    //
    //         var extra;
    //         if (selectable || level) {
    //             extra = {};
    //             if (selectable) {
    //                 extra.selectable = selectable == 'true';
    //             }
    //             if (level) {
    //                 extra.level = level;
    //             }
    //         }
    //
    //
    //         var urlParam = new UrlParamModel();
    //
    //         urlParam.param = urlSlug(text);
    //         urlParam.postType = postType;
    //         urlParam.text = text;
    //         urlParam.type = id;
    //         if (extra) {
    //             urlParam.extra = extra;
    //         }
    //         urlParam = await urlParam.save();
    //
    //         return res.json({
    //             status: 1,
    //             data: urlParam,
    //             message: 'request success !'
    //         });
    //
    //     }
    //     catch (e) {
    //         return res.json({
    //             status: 0,
    //             data: {},
    //             message: 'unknown error : ' + e.message
    //         });
    //     }
    // },

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
                area: area,
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

    },

    search2: async function (req, res, next) {

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
                    message: url + ' url invalid 1'
                });

            }


            var urlSplited = url.trim().split('/');

            if (!urlSplited || urlSplited.length != 2) {
                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid 2'
                });
            }

            let slug = urlSplited[0];
            let param = urlSplited[1];

            if (!slug || slug.length == 0 || !param || param.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: url + ' url invalid 3'
                });
            }


            if (slug == global.SLUG_NEWS || slug == global.SLUG_PROJECT || slug == global.SLUG_SELL_OR_BUY) {

                var data = {};

                let post = await PostModel.findOne({
                    status: global.STATUS.ACTIVE,
                    url: param
                });

                if (!post) {
                    return res.json({
                        status: 0,
                        data: {},
                        message: 'post not found'
                    });
                }

                let cat = await UrlParamModel.findOne({_id: post.params});
                let query = {status: global.STATUS.ACTIVE};

                if (cat && cat.postType) {
                    query.postType = cat.postType;
                }

                if (cat && cat.formality) {
                    query.formality = cat.formality;
                }
                if (cat && cat.type) {
                    query.type = cat.type;
                }
                if (cat && cat.city) {
                    query.city = cat.city;
                }
                if (cat && cat.district) {
                    query.district = cat.district;
                }
                if (cat && cat.ward) {
                    query.ward = cat.ward;
                }
                if (cat && cat.street) {
                    query.street = cat.street;
                }

                if (cat && cat.project) {
                    query.project = cat.project;
                }

                if (cat && cat.balconyDirection) {
                    query.balconyDirection = cat.balconyDirection;
                }
                if (cat && cat.bedroomCount) {
                    query.bedroomCount = cat.bedroomCount;
                }
                if (cat && cat.areaMax) {
                    query.areaMax = cat.areaMax;
                }
                if (cat && cat.areaMin) {
                    query.areaMin = cat.areaMin;
                }
                if (cat && cat.area) {
                    query.area = cat.area;
                }

                if (cat && cat.priceMax) {
                    query.priceMax = cat.priceMax;
                }
                if (cat && cat.priceMin) {
                    query.priceMin = cat.priceMin;
                }
                if (cat && cat.price) {
                    query.price = cat.price;
                }
                // if (cat && cat.extra) {
                //     query.extra = cat.extra;
                // }
                // if (cat && cat.text) {
                //     query.text = cat.text;
                // }

                query._id = {$ne: post._id};


                let related = await PostModel.find(query).limit(10);


                if (slug == global.SLUG_NEWS) {


                    if (post.postType != global.POST_TYPE_NEWS) {
                        return res.json({
                            status: 0,
                            data: {},
                            message: 'post of news not found 1'
                        });
                    }

                    let news = await NewsModel.findOne({
                        _id: post.contentId
                    });

                    if (!news) {
                        return res.json({
                            status: 0,
                            data: {},
                            message: 'news not found'
                        });
                    }


                    data = {
                        title: news.title,
                        content: news.content,
                        cate: news.type,
                        image: news.image,
                        description: news.description,
                        date: news.date,

                        id: post._id,
                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                        url: post.url
                    };


                }

                if (slug == global.SLUG_PROJECT) {


                    if (post.postType != global.POST_TYPE_PROJECT) {
                        return res.json({
                            status: 0,
                            data: {},
                            message: 'post of project not found 1'
                        });
                    }

                    let project = await ProjectModel.findOne({
                        _id: post.contentId
                    });

                    if (!project) {
                        return res.json({
                            status: 0,
                            data: {},
                            message: 'project not found'
                        });
                    }


                    data = {
                        isShowOverview: project.isShowOverview,
                        type: project.type,
                        introImages: project.introImages,
                        title: project.title,
                        address: project.address,
                        area: project.area,
                        projectScale: project.projectScale,
                        price: project.price,
                        deliveryHouseDate: project.deliveryHouseDate,
                        constructionArea: project.constructionArea,
                        descriptionInvestor: project.descriptionInvestor,
                        description: project.description,

                        isShowLocationAndDesign: project.isShowLocationAndDesign,
                        location: project.location,
                        infrastructure: project.infrastructure,

                        isShowGround: project.isShowGround,
                        overallSchema: project.overallSchema,
                        groundImages: project.groundImages,

                        isShowImageLibs: project.isShowImageLibs,
                        imageAlbums: project.imageAlbums,

                        isShowProjectProgress: project.isShowProjectProgress,
                        projectProgressTitle: project.projectProgressTitle,
                        projectProgressStartDate: project.projectProgressStartDate,
                        projectProgressEndDate: project.projectProgressEndDate,
                        projectProgressDate: project.projectProgressDate,
                        projectProgressImages: project.projectProgressImages,

                        isShowTabVideo: project.isShowTabVideo,
                        video: project.video,

                        isShowFinancialSupport: project.isShowFinancialSupport,
                        financialSupport: project.financialSupport,

                        isShowInvestor: project.isShowInvestor,
                        detailInvestor: project.detailInvestor,

                        district: project.district,
                        city: project.city,

                        status: project.status,

                        id: post._id,
                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage,
                        url: post.url
                    }

                }

                if (slug == global.global.SLUG_SELL_OR_BUY) {


                    if (post.postType != global.POST_TYPE_BUY && post.postType != global.POST_TYPE_SALE) {
                        return res.json({
                            status: 0,
                            data: {},
                            message: 'post of buy or sell not found 1'
                        });
                    }


                    if (post.postType == global.POST_TYPE_BUY) {

                        let buy = await BuyModel.findOne({
                            _id: post.contentId
                        });

                        if (!buy) {
                            return res.json({
                                status: 0,
                                data: {},
                                message: 'buy not found'
                            });
                        }

                        let keys;

                        if (!buy.keywordList) {
                            keys = [];
                        }
                        else {
                            keys = await Promise.all(buy.keywordList.map(async key => {

                                    return {
                                        keyword: key,
                                        slug: urlSlug(key)
                                    }
                                }
                            ));
                        }

                        data = {
                            title: buy.title,
                            formality: buy.formality,
                            type: buy.type,
                            city: buy.city,
                            district: buy.district,
                            ward: buy.ward,
                            street: buy.street,
                            project: buy.project,
                            area: buy.area,
                            price: buy.price,
                            unit: buy.unit,
                            address: buy.address,
                            keywordList: keys,
                            description: buy.description,
                            streetWidth: buy.streetWidth,
                            frontSize: buy.frontSize,
                            direction: buy.direction,
                            balconyDirection: buy.balconyDirection,
                            floorCount: buy.floorCount,
                            bedroomCount: buy.bedroomCount,
                            toiletCount: buy.toiletCount,
                            furniture: buy.furniture,
                            images: buy.images,
                            contactName: buy.contactName,
                            contactAddress: buy.contactAddress,
                            contactPhone: buy.contactPhone,
                            contactMobile: buy.contactMobile,
                            contactEmail: buy.contactEmail,
                            date: buy.date,

                            id: post._id,
                            url: post.url,
                            to: post.to,
                            from: post.from,
                            priority: post.priority,
                            postType: post.postType,
                            status: post.status,
                            paymentStatus: post.paymentStatus,
                            refresh: post.refresh,
                            metaTitle: post.metaTitle,
                            metaDescription: post.metaDescription,
                            metaType: post.metaType,
                            metaUrl: post.metaUrl,
                            metaImage: post.metaImage,
                            canonical: post.canonical,
                            textEndPage: post.textEndPage,
                        }


                    }

                    if (post.postType == global.POST_TYPE_SALE) {
                        let sale = await SaleModel.findOne({
                            _id: post.contentId
                        });

                        if (!sale) {
                            return res.json({
                                status: 0,
                                data: {},
                                message: 'sale not found'
                            });
                        }

                        let keys;

                        if (!sale.keywordList) {
                            keys = [];
                        }
                        else {
                            keys = await Promise.all(sale.keywordList.map(async key => {

                                    return {
                                        keyword: key,
                                        slug: urlSlug(key)
                                    }
                                }
                            ));
                        }

                        data = {
                            title: sale.title,
                            description: sale.description,
                            keywordList: keys,
                            formality: sale.formality,
                            type: sale.type,
                            city: sale.city,
                            district: sale.district,
                            ward: sale.ward,
                            street: sale.street,
                            project: sale.project,
                            areaMin: sale.areaMin,
                            areaMax: sale.areaMax,
                            priceMin: sale.priceMin,
                            priceMax: sale.priceMax,
                            unit: sale.unit,
                            address: sale.address,
                            images: sale.images,
                            contactName: sale.contactName,
                            contactAddress: sale.contactAddress,
                            contactPhone: sale.contactPhone,
                            contactMobile: sale.contactMobile,
                            contactEmail: sale.contactEmail,
                            receiveMail: sale.receiveMail,
                            date: sale.date,

                            id: post._id,
                            url: post.url,
                            to: post.to,
                            from: post.from,
                            priority: post.priority,
                            postType: post.postType,
                            status: post.status,
                            paymentStatus: post.paymentStatus,
                            refresh: post.refresh,
                            metaTitle: post.metaTitle,
                            metaDescription: post.metaDescription,
                            metaType: post.metaType,
                            metaUrl: post.metaUrl,
                            metaImage: post.metaImage,
                            canonical: post.canonical,
                            textEndPage: post.textEndPage
                        };


                    }


                }
                return res.json({
                    status: 1,
                    type: post.postType,
                    seo: {
                        url: post.url,
                        metaTitle: post.metaTitle,
                        metaDescription: post.metaDescription,
                        metaType: post.metaType,
                        metaUrl: post.metaUrl,
                        metaImage: post.metaImage,
                        canonical: post.canonical,
                        textEndPage: post.textEndPage
                    },

                    isList: false,
                    related: related,
                    params: query,
                    data: data,
                    message: 'request success'
                });

            }


            if (slug == global.global.SLUG_CATEGORY_SELL_OR_BUY || slug == global.global.SLUG_CATEGORY_NEWS || slug == global.global.SLUG_CATEGORY_PROJECT) {

                var isFound = true;
                var query = {status: global.STATUS.ACTIVE};

                var cat = await UrlParamModel.findOne({param: param});

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
                    if (cat.areaMax) {
                        query.areaMax = cat.areaMax;
                    }
                    if (cat.areaMin) {
                        query.areaMin = cat.areaMin;
                    }
                    if (cat.area) {
                        query.area = cat.area;
                    }

                    if (cat.priceMax) {
                        query.priceMax = cat.priceMax;
                    }
                    if (cat.priceMin) {
                        query.priceMin = cat.priceMin;
                    }
                    if (cat.price) {
                        query.price = cat.price;
                    }

                }
                else {
                    cat = {};
                    isFound = false
                }
                var results = [];
                var count = 0;
                if (isFound) {

                    var model;

                    switch (cat.postType) {
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

                    count = await model.count(query);
                    results = await Promise.all(data.map(async item => {

                        let post = await PostModel.findOne({contentId: item._id});

                        if (!post) {
                            return {};
                        }

                        if (cat.postType == global.POST_TYPE_SALE) {

                            let sale = item;

                            let keys;

                            if (!sale.keywordList) {
                                keys = [];
                            }
                            else {
                                keys = await Promise.all(sale.keywordList.map(async key => {

                                        return {
                                            keyword: key,
                                            slug: urlSlug(key)
                                        }
                                    }
                                ));
                            }


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
                                keywordList: keys,

                                id: post._id,
                                url: post.url,
                                to: post.to,
                                from: post.from,
                                priority: post.priority,
                                postType: post.postType,
                                status: post.status,
                                paymentStatus: post.paymentStatus,
                                refresh: post.refresh,

                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage


                            };
                        }
                        if (cat.postType == global.POST_TYPE_BUY) {


                            let buy = item;

                            let keys;

                            if (!buy.keywordList) {
                                keys = [];
                            }
                            else {
                                keys = await Promise.all(buy.keywordList.map(async key => {

                                        return {
                                            keyword: key,
                                            slug: urlSlug(key)
                                        }
                                    }
                                ));
                            }

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
                                keywordList: keys,


                                id: post._id,
                                url: post.url,
                                to: post.to,
                                from: post.from,
                                priority: post.priority,
                                postType: post.postType,
                                status: post.status,
                                paymentStatus: post.paymentStatus,
                                refresh: post.refresh,

                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage
                            };
                        }

                        if (cat.postType == global.POST_TYPE_PROJECT) {

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

                                id: post._id,
                                url: post.url,

                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage
                            };

                        }
                        if (cat.postType == global.POST_TYPE_NEWS) {
                            let news = item;

                            return {
                                title: news.title,
                                cate: news.type,
                                image: news.image,
                                date: news.date,
                                description: news.description,

                                id: post._id,
                                url: post.url,

                                metaTitle: post.metaTitle,
                                metaDescription: post.metaDescription,
                                metaType: post.metaType,
                                metaUrl: post.metaUrl,
                                metaImage: post.metaImage,
                                canonical: post.canonical,
                                textEndPage: post.textEndPage

                            };

                        }


                    }));

                }

                query.postType = cat.postType;
                return res.json({
                    status: 1,
                    type: cat.postType,
                    seo: {
                        url: cat.param,
                        metaTitle: cat.metaTitle,
                        metaDescription: cat.metaDescription,
                        metaType: cat.metaType,
                        metaUrl: cat.metaUrl,
                        metaImage: cat.metaImage,
                        canonical: cat.canonical,
                        textEndPage: cat.textEndPage
                    },
                    isList: true,
                    params: query,
                    data: {
                        itemCount: count,
                        items: results,
                        page: page,
                        total: _.ceil(count / global.PAGE_SIZE)
                    },
                    message: 'request success '
                });

            }
            return res.json({
                status: 0,
                data: {},
                message: 'url not found'
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
module.exports = SearchController
