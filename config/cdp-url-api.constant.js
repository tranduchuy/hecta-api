const host = 'http://localhost:2902';

module.exports = {
  USER: {
    LOGIN: `${host}/user/login`,
    INFO: `${host}/user/info`,
    VERIFY_TOKEN: `${host}/user/valid-token`,
    REGISTER: `${host}/user/register`,
    HIGHLIGHT: `${host}/user/highlight`,
    CONFIRM_EMAIL: `${host}/user/confirm-email`,
    RESEND_CONFIRM_EMAIL: `${host}/user/resend-confirm-email`,
    FORGET_PASSWORD: `${host}/user/forget-password`,
    RESET_PASSWORD: `${host}/user/reset-password`,
    FIND_USER_BY_EMAIL: `${host}/user/find-detail`,
    CHECK_DUP_USERNAME_EMAIL: `${host}/user/check-email-username`
  },
  TRANSACTION_HISTORY: {
    LIST_MY: `${host}/transaction-history/list-my`,
    LIST_CHILD: `${host}/transaction-history/list-child`
  }
};