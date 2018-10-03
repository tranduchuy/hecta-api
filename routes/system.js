const express = require('express');
const router = express.Router({});

const SystemController = require('../controller/SystemController');

router.get('/', SystemController.getDefaultSystemConfig);
router.put('/', SystemController.updateConfig);

module.exports = router;
