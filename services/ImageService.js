var request = require('request');
var log4js = require('log4js');
var logger = log4js.getLogger('Controllers');


var ImageService = {
  postConfirmImage: function (paths) {
    request.post({url: global.API_COMFIRM_IMAGE, form: {paths}}, function (req, httpResponse, body) {
      if (body.status != 1)
        logger.error(['POST CONFIRM IMAGE error', body, global.API_COMFIRM_IMAGE, paths]);
      else
        logger.info(['POST CONFIRM IMAGE info', global.API_COMFIRM_IMAGE, paths]);
    })
  },
  
  putUpdateImage: function (oldImages, newImages) {
    request.put({url: global.API_COMFIRM_IMAGE, form: {oldImages, newImages}}, function (err, httpResponse, body) {
      if (body.status!= 1)
        logger.error(['PUT UPDATE IMAGE error', body, global.API_COMFIRM_IMAGE, paths]);
      else
        logger.info(['PUST UPDATE IMAGE info', global.API_COMFIRM_IMAGE, paths]);
    })
  }
}

module.exports = ImageService