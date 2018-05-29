var express = require('express');
var router = express.Router();

var BuyController = require('../controller/BuyController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('sales');
});

router.post('/add', BuyController.add);


module.exports = router;
