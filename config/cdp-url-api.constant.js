const host = 'http://localhost:2902';

module.exports = {
  USER: {
    LOGIN: `${host}/user/login`,
    INFO: `${host}/user/info`,
    VERIFY_TOKEN: `${host}/user/valid-token`,
    REGISTER: `${host}/user/register`,
    HIGHLIGHT: `${host}/user/highlight`
  },
  TRANSACTION_HISTORY: {
    LIST_MY: `${host}/transaction-history/list-my`,
    LIST_CHILD: `${host}/transaction-history/list-child`
  }
};