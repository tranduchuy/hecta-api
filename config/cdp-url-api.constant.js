const host = 'http://localhost:2902';

module.exports = {
  USER: {
    LOGIN: `${host}/user/login`,
    INFO: `${host}/user/info`,
    VERIFY_TOKEN: `${host}/user/valid-token`
  }
};