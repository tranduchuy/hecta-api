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
        var street_width = req.body.street_width;
        var front_size = req.body.front_size;
        var direction = req.body.direction;
        var balcony_direction = req.body.balcony_direction;
        var floor_count = req.body.floor_count;
        var bedroom_count = req.body.bedroom_count;
        var toilet_count = req.body.toilet_count;
        var furniture = req.body.furniture;
        var images = req.body.images;
        var contact_name = req.body.contact_name;
        var contact_address = req.body.contact_address;
        var contact_phone = req.body.contact_phone;
        var contact_mobile = req.body.contact_mobile;
        var contact_email = req.body.contact_email;


        var priority = req.body.priority;
        var from = req.body.from;
        var to = req.body.to;


        try {

            if (!token) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token must be not empty'
                });


            }
            var accessToken = await  TokenModel.findOne({token: token});
            if (!accessToken) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'access token incorrect'
                });

            }

            if (!title || !source || !destination || !start || !end || !cost || !note || !vehicles || !_.toNumber(start) || !_.toNumber(end) || !_.toNumber(cost)) {

                return res.json({
                    status: 0,
                    data: {
                        title: !title,
                        source: !source,
                        destination: !destination,
                        start: !_.toNumber(start),
                        end: !_.toNumber(end),
                        cost: !_.toNumber(cost),
                        note: !note,
                        vehicles: !vehicles
                    },
                    message: 'title, source, destination, start, end, cost, note, vihicles must be not null and start, end, cost must be number'
                });

            }


            var shipper = new ShipperModel();

            shipper.user = accessToken.user;
            shipper.title = title;
            shipper.title_ = normalize(title);
            shipper.destination = JSON.parse(destination);
            shipper.destination_ = normalize(destination);
            shipper.source = JSON.parse(source);
            shipper.source_ = normalize(source);
            shipper.cost = cost;
            shipper.start = start;
            shipper.end = end;
            shipper.note = note;
            shipper.vehicles = vehicles;
            shipper.status = global.STATUS_ACTIVE
            var result = await  shipper.save();

            if (!result) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'cannot save data'
                });


            }

            return res.json({
                status: 1,
                data: result,
                message: 'add order success'
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
