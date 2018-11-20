const express = require('express');
const router = express.Router({});
const TagController = require('../controller/TagController');

router['get']('/list', TagController.list);
router['get']('/highlight', TagController.highlight);
router['get']('/query', TagController.query);
router['get']('/related', TagController.getRelated);

module.exports = router;
