// url, body, token
const request = require('request');

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

      return resolve(body);
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

      return resolve(body);
    });
  });
};

const put = (uri, data, token) => {
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

      return resolve(body);
    });
  });
};

const del = (uri, token) => {
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

      return resolve(body);
    });
  });
}

module.exports = {get, post, put, del};