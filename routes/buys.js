var express = require('express');
var router = express.Router();

var BuyController = require('../controller/BuyController');



router.post('/add', BuyController.add);
router.post('/update/:id', BuyController.update);
router.get('/list', BuyController.list);
router.get('/detail/:id', BuyController.detail);


module.exports = router;
