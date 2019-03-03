var express = require('express');
var router = express.Router();

var SaleController = require('../controller/user/SaleController');

router.post('/add', SaleController.add);
router.post('/update/:id', SaleController.update);
router.post('/upnew/:id', SaleController.upNew);


module.exports = router;
