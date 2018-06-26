var UrlParamModel = require('../models/UrlParamModel');
var data = require('../files/js/selectorX');
var urlSlug = require('url-slug');
const {forEach} = require('p-iteration');

var ScriptController = {

    generateUrl: async function (req, res, next) {
        req.setTimeout(1000 * 60 * 60);

        try {


            // var urlParam = new UrlParamModel();
            // urlParam.param = param;
            // urlParam.postType = postType;
            // urlParam.formality = formality;
            // urlParam.type = type;
            // urlParam.city = city;
            // urlParam.district = district;
            // urlParam.ward = ward;
            // urlParam.street = street;
            // urlParam.project = project;
            // urlParam.balconyDirection = balconyDirection;
            // urlParam.bedroomCount = bedroomCount;
            // urlParam.area = area;
            // urlParam.price = price;
            //
            // urlParam = await urlParam.save();

            // await UrlParamModel.remove({});

            var urlParam;
            // // add buy
            //
            // let buys = data.cateListBuy;
            //
            // for (let buy of buys) {
            //     // await forEach(buys, async buy => {
            //
            //     urlParam = new UrlParamModel();
            //     urlParam.param = urlSlug(buy.name);
            //     urlParam.postType = global.POST_TYPE_BUY;
            //     urlParam.formality = buy.id;
            //
            //     console.log(urlParam.param);
            //
            //
            //     await urlParam.save();
            //
            //
            //     let children = buy.children;
            //
            //     for (let child of children) {
            //         // await forEach(children, async child => {
            //
            //         urlParam = new UrlParamModel();
            //         urlParam.param = urlSlug(child.name);
            //         urlParam.postType = global.POST_TYPE_BUY;
            //         urlParam.formality = buy.id;
            //         urlParam.type = child.id;
            //
            //         console.log(urlParam.param);
            //
            //
            //         await urlParam.save();
            //
            //
            //     }
            //
            //
            // }


            // add sale

            let sales = data.cateList;

            for (let sale of sales) {
                // await forEach(sales, async sale => {

                urlParam = new UrlParamModel();
                urlParam.param = urlSlug(sale.name);
                urlParam.postType = global.POST_TYPE_SALE;
                urlParam.formality = sale.id;

                console.log(urlParam.param);


                urlParam.save();


                let children = sale.children;

                for (let child of children) {
                    // await forEach(children, async child => {

                    urlParam = new UrlParamModel();
                    urlParam.param = urlSlug(child.name);
                    urlParam.postType = global.POST_TYPE_SALE;
                    urlParam.formality = sale.id;
                    urlParam.type = child.id;

                    console.log(urlParam.param);


                    await urlParam.save();


                }


            }

            // with city, district, ward, street

            let cities = data.cityListOTher1;

            var params = await UrlParamModel.find({postType : 1});

            for (let city of cities) {

                // await forEach(cities, async city => {

                for (let param of params) {
                    // await forEach(params, async param => {

                    urlParam = new UrlParamModel();
                    urlParam.param = urlSlug(param.param + ' tai ' + city.name);
                    urlParam.postType = param.postType;
                    urlParam.formality = param.formality;
                    urlParam.type = param.type;
                    urlParam.city = city.code;

                    console.log(urlParam.param);


                    urlParam.save();


                    let districts = city.district;

                    for (let district of districts) {
                        // await forEach(districts, async district => {
                        urlParam = new UrlParamModel();

                        urlParam.param = urlSlug(param.param + ' ' + district.pre + ' ' + district.name + ' ' + city.name);
                        urlParam.postType = param.postType;
                        urlParam.formality = param.formality;
                        urlParam.type = param.type;
                        urlParam.city = city.code;
                        urlParam.district = district.id;

                        console.log(urlParam.param);


                        urlParam.save();


                        let wards = district.ward;


                        for (let ward of wards) {
                            // await forEach(wards, async ward => {

                            urlParam = new UrlParamModel();

                            urlParam.param = urlSlug(param.param + ' ' + ward.pre + ' ' + ward.name + ' ' + district.pre + ' ' + district.name);

                            let checkParam = await UrlParamModel.findOne({param: urlParam.param});
                            if (checkParam) {
                                urlParam.param += '-' + ward.id;
                            }

                            urlParam.postType = param.postType;
                            urlParam.formality = param.formality;
                            urlParam.type = param.type;
                            urlParam.city = city.code;
                            urlParam.district = district.id;
                            urlParam.ward = ward.id;


                            console.log(urlParam.param);

                            await urlParam.save();

                        }


                        let streets = district.street;
                        for (let street of streets) {
                            // await forEach(wards, async ward => {

                            urlParam = new UrlParamModel();

                            urlParam.param = urlSlug(param.param + ' ' + street.pre + ' ' + street.name + ' ' + district.pre + ' ' + district.name);

                            let checkParam = await UrlParamModel.findOne({param: urlParam.param});
                            if (checkParam) {
                                urlParam.param += '-' + street.id;
                            }

                            urlParam.postType = param.postType;
                            urlParam.formality = param.formality;
                            urlParam.type = param.type;
                            urlParam.city = city.code;
                            urlParam.district = district.id;
                            urlParam.street = street.id;


                            console.log(urlParam.param);

                            await urlParam.save();


                            for (let ward of wards) {
                                // await forEach(wards, async ward => {

                                urlParam = new UrlParamModel();

                                urlParam.param = urlSlug(param.param + ' ' + street.pre + ' ' + street.name + ' ' + ward.pre + ' ' + ward.name);

                                 let checkParam = await UrlParamModel.findOne({param: urlParam.param});
                                if (checkParam) {
                                    urlParam.param += '-' + ward.id;
                                    let checkParam = await UrlParamModel.findOne({param: urlParam.param});
                                    if (checkParam) {
                                        urlParam.param += '-' + ward.id + '-d';
                                    }
                                }

                                urlParam.postType = param.postType;
                                urlParam.formality = param.formality;
                                urlParam.type = param.type;
                                urlParam.city = city.code;
                                urlParam.district = district.id;
                                urlParam.ward = ward.id;
                                urlParam.street = street.id;


                                console.log(urlParam.param);

                                await urlParam.save();

                            }

                        }

                    }


                }


            }

            params = await UrlParamModel.find({postType : 1});

            for (let param of params) {
                let directions = data.directionList;
                for (let direction of directions) {

                    urlParam = new UrlParamModel();

                    urlParam.param = urlSlug(param.param + ' huong ' + direction.name);

                    urlParam.postType = param.postType;
                    urlParam.formality = param.formality;
                    urlParam.type = param.type;
                    urlParam.city = param.city;
                    urlParam.district = param.district;
                    urlParam.ward = param.ward;
                    urlParam.street = param.street;
                    urlParam.balconyDirection = direction.value;

                    console.log(urlParam.param);

                    await urlParam.save();
                }


            }

            params = await UrlParamModel.find({postType : 1});

            for (let param of params) {
                let prices = data.priceLevel;
                for (let price of prices) {

                    urlParam = new UrlParamModel();

                    urlParam.param = urlSlug(param.param + ' gia ' + price.Value);

                    urlParam.postType = param.postType;
                    urlParam.formality = param.formality;
                    urlParam.type = param.type;
                    urlParam.city = param.city;
                    urlParam.district = param.district;
                    urlParam.ward = param.ward;
                    urlParam.street = param.street;
                    urlParam.balconyDirection = param.balconyDirection;
                    urlParam.priceMax = price.max.value;
                    urlParam.priceMin = price.min.value;
                    urlParam.price = price.Name;

                    // priceMax: Number,
                    //     priceMin: Number,

                    console.log(urlParam.param);

                    await urlParam.save();
                }


            }

            params = await UrlParamModel.find({postType : 1});

            for (let param of params) {
                let areas = data.areaList;
                for (let area of areas) {

                    urlParam = new UrlParamModel();

                    urlParam.param = urlSlug(param.param + ' dien tich ' + area.Value);

                    urlParam.postType = param.postType;
                    urlParam.formality = param.formality;
                    urlParam.type = param.type;
                    urlParam.city = param.code;
                    urlParam.district = param.id;
                    urlParam.ward = param.id;
                    urlParam.street = param.id;
                    urlParam.balconyDirection = param.balconyDirection;
                    urlParam.priceMax = param.priceMax;
                    urlParam.priceMin = param.priceMin;
                    urlParam.price = param.price;
                    urlParam.areaMax = area.max.value;
                    urlParam.areaMin = area.min.value;
                    urlParam.area = area.Name;

                    // priceMax: Number,
                    //     priceMin: Number,

                    console.log(urlParam.param);

                    await urlParam.save();
                }


            }

            let count = await UrlParamModel.count();

            return res.json({
                status: 1,
                data: {total: count},
                message: 'success !'
            });

        }
        catch (e) {
            return res.json({
                status: 0,
                data: urlParam,
                message: 'unknown error : ' + e.message
            });
        }


    }

}
module.exports = ScriptController
