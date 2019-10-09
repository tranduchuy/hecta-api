const express = require('express');
const router = express.Router({});
const TagController = require('../controller/user/TagController');

router['get']('/list', TagController.list);

module.exports = router;
