var express = require('express');
var router = express.Router();

var SaleController = require('../controller/SaleController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('sales');
});

router.post('/add', SaleController.add);
router.get('/list', SaleController.list);
router.get('/detail/:id', SaleController.detail);


module.exports = router;
