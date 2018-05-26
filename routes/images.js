var express = require('express');
var router = express.Router();

var ImageController = require('../controller/ImageController');

/* GET users listing. */

router.post('/upload', ImageController.upload);
router.get('/get/:image', ImageController.get);


module.exports = router;
