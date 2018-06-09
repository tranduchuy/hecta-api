var express = require('express');
var router = express.Router();

var PostController = require('../controller/PostController');



router.get('/detail/:id', PostController.detail);


module.exports = router;
