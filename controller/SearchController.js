var fs = require('fs');

var SearchController = {


    addUrl: async function (req, res, next) {


    }
    ,
    search: async function (req, res, next) {


        try {

            var url = req.query.url;


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
