var express = require('express');
var router = express.Router();

var BuyController = require('../controller/BuyController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('buys');
});

router.post('/add', BuyController.add);
router.get('/list', BuyController.list);
router.get('/detail/:id', BuyController.detail);


module.exports = router;
