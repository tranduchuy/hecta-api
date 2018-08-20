var express = require('express');
var router = express.Router();

var SearchController = require('../controller/SearchController');



router.get('/', SearchController.search);
router.post('/box', SearchController.filter);
// router.post('/add', SearchController.addParamUrl);


module.exports = router;
