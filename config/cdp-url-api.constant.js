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
    CHECK_DUP_USERNAME_EMAIL: `${host}/user/check-email-username`,
    UPDATE_USER_INFO: `${host}/user/:id`,
    SALE_COST: `${host}/user/balance/sale-cost`,
    UP_NEW: `${host}/user/balance/up-news-cost`,
    LIST_USER: `${host}/user`
  },
  ADMIN: {
    UPDATE_BALANCE: `${host}/user/balance`
  },
  RELATION_SHIP: {
    REQUEST_LIST: `${host}/user-relationship/request`,
    CHILD_DETAIL: `${host}/user-relationship/child-detail`,
    LIST_CHILD: `${host}/user-relationship/children`,
    ADD_REGISTERED_CHILD: `${host}/user-relationship/add-registered-child`,
    ADD_NEW_CHILD: `${host}/user-relationship/add-child`,
    CHILD_REPLY_REQUEST: `${host}/user-relationship/child-reply-request`,
    REMOVE_CHILD: `${host}/user-relationship/remove-child`
  },
  TRANSACTION_HISTORY: {
    LIST_MY: `${host}/transaction-history/list-my`,
    LIST_CHILD: `${host}/transaction-history/list-child`
  }
};