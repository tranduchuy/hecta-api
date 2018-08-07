var express = require('express');
var router = express.Router();

var PostController = require('../controller/PostController');



router.get('/list', PostController.list);
router.get('/child/:id', PostController.child);
router.get('/latest', PostController.latest);
router.get('/top/city', PostController.topCity);
router.get('/detail/:id', PostController.detail);


module.exports = router;
