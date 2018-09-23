var express = require('express');
var router = express.Router();
var NotifyController = require('../controller/NotifyController');

router.get('', NotifyController.getListNotifies);
router.put('/:notifyId', NotifyController.updateNotify);

module.exports = router;
