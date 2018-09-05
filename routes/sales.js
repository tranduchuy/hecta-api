var express = require('express');
var router = express.Router();

var SaleController = require('../controller/SaleController');

router.post('/add', SaleController.add);
router.post('/update/:id', SaleController.update);


module.exports = router;
