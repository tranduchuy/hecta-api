var express = require('express');
var router = express.Router();

var ProjectController = require('../controller/ProjectController');



router.post('/add', ProjectController.add);
router.get('/list', ProjectController.list);
router.post('/update/:id', ProjectController.update);


module.exports = router;
