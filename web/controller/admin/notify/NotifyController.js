const NotifyModel = require('../../../models/Notify');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const httpCode = require('../../../config/http-code');
const requestUtil = require('../../../utils/RequestUtil');
const NotifyType = require('../../../config/notify-type');
const {post, del, put, get, convertObjectToQueryString} = require('../../../utils/Request');
const CDP_APIS = require('../../../config/cdp-url-api.constant');
/**
 *
 * @param {*} status
 * @return {Boolean}
 */
const isValidStatusForUpdating = (status) => {
  // TODO: will update this list when new status of notify appeared
  return [
    global.STATUS.NOTIFY_NONE,
    global.STATUS.NOTIFY_READ
  ].indexOf(status) !== -1;
};
/**
 * Api get list notify
 * @param {*} req body: {status, title, content}, params: {notifyId}
 * @param {*} res
 * @param {*} next
 */
const getListReturnLeadNotifies = async (req, res, next) => {
  logger.info('NotifyController::getListReturnLeadNotifies is called');
  try {
    const {page, limit} = requestUtil.extractPaginationCondition(req);
    const query = {
        status: NotifyType.USER_WANT_TO_RETURN_LEAD
    };

    const total = await NotifyModel.countDocuments(query);

    let notifies = await NotifyModel
      .find(query)
      .sort({createdTime: -1})
      .skip((page - 1) * limit)
      .limit(limit);

    if(notifies.length === 0){
        return res.json({
            status: httpCode.SUCCESS,
            message: [],
            data: {
                meta: {
                    totalItems: total,
                    page: page,
                    limit: limit,
                    sortBy: 'createdTime'
                },
                entries: notifies
            }
        })
    }

    const userIds = notifies
      .filter(n => n.fromUser)
      .map(n => n.fromUser);

    // get detail of list userId
    const urlGetListUser = `${CDP_APIS.USER.LIST_USER_FOR_NOTIFY}?ids=${userIds.join(',')}`;
    get(urlGetListUser, req.user.token)
      .then((response) => {
        const userObj = {};
        response.data.entries.forEach(u => {
          userObj[u.id] = u;
        });

        const requestTypes = [
          NotifyType.PARENT_CHILD.REQUEST,
          NotifyType.PARENT_CHILD.RESPONSE,
          NotifyType.PARENT_CHILD.REMOVE,
        ];
        notifies = JSON.parse(JSON.stringify(notifies));
        notifies.forEach(n => {
          n.fromUser = userObj[n.fromUser] || null;
        });
        let results = [];

        // get relation detail
        const requestIdsNeedRelationInfo = notifies
          .filter(n => requestTypes.indexOf(n.type) !== -1)
          .map(n => n.params.requestId);

        const urlGetRelationDetail = `${CDP_APIS.RELATION_SHIP.DETAIL_BY_IDS}?ids=${requestIdsNeedRelationInfo.join(',')}`;
        get(urlGetRelationDetail, req.user.token)
          .then(response => {
            const relationDetailObj = {};
            response.data.entries.forEach(re => {
              relationDetailObj[re.id] = re;
            });

            notifies.forEach((n) => {
              if (requestTypes.indexOf(n.type) !== -1) {
                n.params.request = relationDetailObj[n.params.requestId];
              }

              results.push(n);
            });

            results = results.map(noti =>{
              return {
                id: noti._id,
                  user: noti.fromUser,
                  lead: noti.params.lead,
                  reason: noti.reason || ''
              }
            });

            return res.json({
              status: httpCode.SUCCESS,
              message: [],
              data: {
                meta: {
                    totalItems: total,
                    page: page,
                    limit: limit,
                    sortBy: 'createdTime'
                },
                entries: results
              }
            })
          })
          .catch(e => {
            logger.error('NotifyController::getListReturnLeadNotifies::error', e);
            return next(e);
          });
      })
      .catch(e => {
        logger.error('NotifyController::getListReturnLeadNotifies::error', e);
        return next(e);
      });
  } catch (e) {
    logger.error('NotifyController::getListReturnLeadNotifies::error', e);
    return next(e);
  }
};

const getUnReadCountOfUser = (userId, cb) => {
  const query = {
    toUser: userId,
    status: global.STATUS.NOTIFY_NONE
  };

  NotifyModel.countDocuments(query, cb);
};

const countUnRead = async (req, res, next) => {
  logger.info('NotifyController::countUnRead is called');

  try {
    getUnReadCountOfUser(req.user._id, (err, count) => {
      if (err) {
        logger.error('NotifyController::countUnRead::error', e);
        return next(err);
      }

      return res.json({
        status: httpCode.SUCCESS,
        message: '',
        data: {
          entry: [],
          meta: {
            unread: count
          }
        }
      })
    });
  } catch (e) {
    logger.error('NotifyController::countUnRead::error', e);
    return next(e);
  }
};

module.exports = {
  countUnRead,
    getListReturnLeadNotifies
};
