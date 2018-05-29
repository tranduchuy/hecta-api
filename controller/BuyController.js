var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');

var BuyController = {
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
        var content = req.body.content;

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

            if (!content || content.length == 0) {
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


            var buy = new BuyModel();

            buy.title = title;
            buy.formality = formality;
            buy.type = type;
            buy.city = city;
            buy.district = district;
            buy.ward = ward;
            buy.street = street;
            buy.project = project;
            buy.area = area;
            buy.price = price;
            buy.unit = unit;
            buy.address = address;
            buy.content = content;

            buy.images = images;
            buy.contact_name = contact_name;
            buy.contact_address = contact_address;
            buy.contact_phone = contact_phone;
            buy.contact_mobile = contact_mobile;
            buy.contact_email = contact_email;


             buy = await buy.save();

            var post = new PostModel();

            post.type = global.POST_TYPE_BUY;
            post.content_id = buy._id;
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
module.exports = BuyController
