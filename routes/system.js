const express = require('express');
const router = express.Router({});

const SystemController = require('../controller/SystemController');

router.get('/', SystemController.getDefaultSystemConfig);
router.get('/statistic', SystemController.getStatisticInfo);
router.put('/', SystemController.updateConfig); // TODO: check middleware login

module.exports = router;
