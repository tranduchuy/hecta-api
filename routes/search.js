var express = require('express');
var router = express.Router();

var SearchController = require('../controller/SearchController');



router.get('/', SearchController.search);


module.exports = router;
