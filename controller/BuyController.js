var PostModel = require('../models/PostModel');
var BuyModel = require('../models/BuyModel');

var BuyController = {
    add: async function (req, res, next) {

        var title = req.body.title;
        var description = req.body.description;

        var formality = req.body.formality;
        var type = req.body.type;
        var city = req.body.city;
        var district = req.body.district;
        var ward = req.body.ward;
        var street = req.body.street;
        var project = req.body.project;
        var areaMin = req.body.areaMin;
        var areaMax = req.body.areaMax;
        var priceMin = req.bodypriceMin;
        var priceMax = req.body.priceMax;
        var unit = req.body.unit;

        var address = req.body.address;

        var images = req.body.images;

        var contact_name = req.body.contactName;
        var contact_address = req.body.contactAddress;
        var contact_phone = req.body.contactPhone;
        var contact_mobile = req.body.contactMobile;
        var contact_email = req.body.contactEmail;

        var from = req.body.from;
        var to = req.body.to;

        var captchaToken = req.body.captchaToken;


        try {


            if (!title || title.length < 30 || title.length > 90) {
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

            if (!contact_phone || contact_phone.length == 9) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'contact_phone : "' + contact_phone + '" is invalid'
                });
            }

            if (!captchaToken || captchaToken.length == 0) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'captchaToken : "' + captchaToken + '" is invalid'
                });
            }


            var buy = new BuyModel();

            buy.title = title;
            buy.description = description;

            buy.formality = formality;
            buy.type = type;
            buy.city = city;
            buy.district = district;
            buy.ward = ward;
            buy.street = street;
            buy.project = project;
            buy.areaMin = areaMin;
            buy.areaMax = areaMax;
            buy.priceMin = priceMin;
            buy.priceMax = priceMax;
            buy.unit = unit;
            buy.address = address;


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
            post.priority = 0;
            post.from = from;
            post.to = to;

            post = await post.save();


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
