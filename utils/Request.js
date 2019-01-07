// url, body, token
const request = require('request');
const HttpCode = require('../config/http-code');

const _handleResponse = (resolve, reject, body) => {
  if (body.status === HttpCode.ERROR) {
    return reject(new Error(body.messages[0]));
  } else {
    return resolve(body);
  }
};

const get = (uri, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      uri,
      method: 'GET',
    };

    if (token && token.toString().trim() !== '') {
      options.headers = {
        ctoken: token
      }
    }

    request(options, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }

      return _handleResponse(resolve, reject, body);
    });
  });
};

const post = (uri, data, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      uri,
      method: 'POST',
      json: data
    };

    if (token && token.toString().trim() !== '') {
      options.headers = {
        ctoken: token
      }
    }

    request(options, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }

      return _handleResponse(resolve, reject, body);
    });
  });
};

const put = (uri, data, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      uri,
      method: 'PUT',
      json: data
    };

    if (token && token.toString().trim() !== '') {
      options.headers = {
        ctoken: token
      }
    }

    request(options, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }

      return _handleResponse(resolve, reject, body);
    });
  });
};

const del = (uri, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      uri,
      method: 'DELETE',
    };

    if (token && token.toString().trim() !== '') {
      options.headers = {
        ctoken: token
      }
    }

    request(options, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }

      return _handleResponse(resolve, reject, body);
    });
  });
}

module.exports = {get, post, put, del};