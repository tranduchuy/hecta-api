let express = require('express');
let router = express.Router();
let SaleController = require('../controller/user/SaleController');

router.post('/add', SaleController.add);
router.post('/update/:id', SaleController.update);
router.post('/upnew/:id', SaleController.upNew);
router.post('/updateAdStatus/:id', SaleController.updateAdStatus);
router.post('/updateCPV/:id', SaleController.updateCPV);
router.post('/updateBudgetPerDay/:id', SaleController.updateBudgetPerDay);
router.post('/buy-contact', SaleController.buyContactOfSale);
router.get('/check-bought-contact', SaleController.checkBoughtContact);

module.exports = router;
