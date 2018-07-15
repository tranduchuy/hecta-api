var express = require('express');
var router = express.Router();

var NewsController = require('../controller/NewsController');


router.get('/list', NewsController.list);
router.get('/highlight', NewsController.highlight);
router.get('/latest', NewsController.latest);
router.get('/detail/:id', NewsController.detail);

router.post('/add', NewsController.add);
router.post('/update/:id', NewsController.update);


module.exports = router;
