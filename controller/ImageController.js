var multiparty = require('multiparty');
var ImageModel = require('../models/ImageModel');
var fs = require('fs');

var ImageController = {

    upload: async function (req, res, next) {


        try {


            var form = new multiparty.Form();

            form.parse(req);
            form.on('file', async function (name, file) {


                var image = new ImageModel();
                image.status = global.STATUS_ACTIVE;

                image = await image.save();

                await fs.createReadStream(file.path).pipe(fs.createWriteStream(global.IMAGE_DIR + '/' + image._id));

                return res.json({
                    status: 1,
                    data: image,
                    success : true,
                    message: 'request success !'
                });


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

    get: async function (req, res, next) {


        try {

            let imageId = req.params.image;

            let image = await ImageModel.findOne({_id: imageId});

            if (!image) {
                return res.json({
                    status: 0,
                    data: {},
                    message: 'image id not exist !'
                });
            }


            let file = global.IMAGE_DIR + '/' + image._id;
            if (!fs.existsSync(file)) {

                return res.json({
                    status: 0,
                    data: {},
                    message: 'image file not exist !'
                });

            }

            res.sendFile(file,{ root : global.ROOT_DIR});

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
module.exports = ImageController
