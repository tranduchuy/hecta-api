var express = require('express');
var router = express.Router();

var ImageController = require('../controller/ImageController');

/* GET users listing. */

router.post('/upload', ImageController.upload);


module.exports = router;
