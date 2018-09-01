var express = require('express');
var router = express.Router();

var TagController = require('../controller/TagController');


router.get('/list', TagController.list);
router.get('/highlight', TagController.highlight);
router.get('/query', TagController.query);


module.exports = router;
