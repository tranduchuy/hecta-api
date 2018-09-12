const request = require('request');
const log4js = require('log4js');
const logger = log4js.getLogger('Services');

const postConfirmImage = function (paths) {
  logger.info('ImageService::postConfirmImage was called with: ' + JSON.stringify(paths));

  const option = {
    uri: global.API_COMFIRM_IMAGE,
    json: { paths },
    method: 'POST'
  };

  request(option, (err, httpResponse, body) => {
    console.log(httpResponse);
    console.log(body);
    if (body.status != 1) {
      logger.error(`POST CONFIRM IMAGE error: ${JSON.stringify(err)}. Params: ${JSON.stringify(option)}`);
    } else {
      logger.info('POST CONFIRM IMAGE info' + JSON.stringify(option));
    }
  });
};

const putUpdateImage = (oldImages, newImages) => {
  logger.info('ImageService::putUpdateImage was called with: ' + JSON.stringify({ oldImages, newImages }));

  const option = {
    uri: global.API_COMFIRM_IMAGE,
    method: 'PUT',
    json: { oldImages, newImages }
  };

  request.put(option, (err, httpResponse, body) => {
    if (body.status != 1) {
      logger.error(`POST CONFIRM IMAGE error: ${JSON.stringify(err)}. Params: ${JSON.stringify(option)}`);
    } else {
      logger.info(['PUST UPDATE IMAGE info', global.API_COMFIRM_IMAGE, paths]);
    }
  })
}

module.exports = {
  postConfirmImage,
  putUpdateImage
}