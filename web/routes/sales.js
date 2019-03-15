var express = require('express');
var router = express.Router();

var SaleController = require('../controller/user/SaleController');

router.post('/add', SaleController.add);
router.post('/update/:id', SaleController.update);
router.post('/upnew/:id', SaleController.upNew);
router.post('/updateAdStatus/:id', SaleController.updateAdStatus);


module.exports = router;
