var SaleModel = require('../models/SaleModel');
var BuyModel = require('../models/BuyModel');
var PostModel = require('../models/PostModel');
var _ = require('lodash');

var PostController = {


    list : async function ( req,res, next)
    {

        // var page = req.query.page;
        // var page = req.query.page;
        // var page = req.query.page;
        // var page = req.query.page;









    },

    detail: async function (req, res, next) {
        let id = req.params.id;

        console.log('id ',id);
        try {

            if (!id || id.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'id null error'
                });

            }

            let post = await PostModel.findOne({_id: id});

            if (!post) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'post not exist'
                });
            }

            let model = post.type == global.POST_TYPE_SALE ? SaleModel : BuyModel;

            let content = await model.findOne({_id: post.content_id});


            if (!content) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'data not exist'
                });


            }

            if (post.type == global.POST_TYPE_SALE) {

                return res.json({
                    status: 1,
                    data: {
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
                        to : post.to,
                        from : post.from,
                        priority : post.priority
                    },
                    message: 'request success'
                });
            }
            else {

                return res.json({
                    status: 1,
                    data: {
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
                        to : post.to,
                        from : post.from,
                        priority : post.priority
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
module.exports = PostController
