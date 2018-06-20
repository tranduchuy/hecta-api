var express = require('express');
var router = express.Router();

var ProjectController = require('../controller/PostController');



router.post('/add', ProjectController.add);


module.exports = router;
