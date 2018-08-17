var express = require('express');
var router = express.Router();

var NewsController = require('../controller/NewsController');


router.get('/highlight', NewsController.highlight);
router.get('/latest', NewsController.latest);



module.exports = router;
