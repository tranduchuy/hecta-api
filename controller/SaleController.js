var SaleModel = require('../models/SaleModel');
var PostModel = require('../models/PostModel');

var OrderController = {
    test: async function (req, res, next) {
        return res.json({
            status: 0,
            data: {},
            message: 'test run'
        });

    },
    add: async function (req, res, next) {

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
        var description = req.body.description;
        var street_width = req.body.streetWidth;
        var front_size = req.body.frontSize;
        var direction = req.body.direction;
        var balcony_direction = req.body.balconyDirection;
        var floor_count = req.body.floorCount;
        var bedroom_count = req.body.bedroomCount;
        var toilet_count = req.body.toiletCount;
        var furniture = req.body.furniture;
        var images = req.body.images;
        var contact_name = req.body.contactName;
        var contact_address = req.body.contactAddress;
        var contact_phone = req.body.contactPhone;
        var contact_mobile = req.body.contactMobile;
        var contact_email = req.body.contactEmail;
        var priority = req.body.priority;
        var from = req.body.from;
        var to = req.body.to;


        try {


            if (!title || title.length < 30 || title.length > 90) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'title : "' + title + '" is invalid'
                });
            }

            if (!formality || formality == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'formality : "' + formality + '" is invalid'
                });
            }

            if (!type || type == 0) {
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

            if (!district || district == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'district : "' + district + '" is invalid'
                });
            }

            if (!description || description.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'description : "' + description + '" is invalid'
                });
            }

            if (!contact_phone || contact_phone.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'contact_phone : "' + contact_phone + '" is invalid'
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
            sale.description = description;
            sale.front_size = front_size;
            sale.street_width = street_width;
            sale.direction = direction;
            sale.balcony_direction = balcony_direction;
            sale.floor_count = floor_count;
            sale.bedroom_count = bedroom_count;
            sale.toilet_count = toilet_count;
            sale.furniture = furniture;
            sale.images = images;
            sale.contact_name = contact_name;
            sale.contact_address = contact_address;
            sale.contact_phone = contact_phone;
            sale.contact_mobile = contact_mobile;
            sale.contact_email = contact_email;


             sale = await sale.save();

            var post = new PostModel();

            post.type = global.POST_TYPE_SALE;
            post.content_id = sale._id;
            post.priority = priority;
            post.from = from;
            post.to = to;

             post =await post.save();


            return res.json({
                status: 1,
                data: post,
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


    }

}
module.exports = OrderController
