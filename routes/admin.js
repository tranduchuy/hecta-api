var express = require('express');
var router = express.Router();

var ProjectController = require('../controller/ProjectController');
var NewsController = require('../controller/NewsController');



router.get('/projects/list', ProjectController.list);
router.get('/projects/types', ProjectController.typeList);

router.post('/projects/add', ProjectController.add);
router.post('/projects/update/:id', ProjectController.update);

router.get('/news/list', NewsController.list);
router.get('/news/cats', NewsController.catList);

router.post('/news/add', NewsController.add);
router.post('/news/update/:id', NewsController.update);


module.exports = router;
