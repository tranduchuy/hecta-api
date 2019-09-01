const express = require('express');
const router = express.Router({});
const SystemController = require('../controller/user/SystemController');
const CheckToken = require('../middlewares/CheckToken');
const CheckRole = require('../middlewares/check-role.middleware');
const UserRoles = require('../constants/user-roles.constant');

router['get']('/', SystemController.getDefaultSystemConfig);
router['get']('/statistic', SystemController.getStatisticInfo);
router['put']('/', [CheckToken, CheckRole([UserRoles.ADMIN, UserRoles.MASTER])],  SystemController.updateConfig);


router.post('/static-pages',
  [CheckToken, CheckRole([UserRoles.ADMIN, UserRoles.MASTER])],
  SystemController.updateStaticPageContent
);
router.get('/static-contents', SystemController.getStaticPageContents);



module.exports = router;
