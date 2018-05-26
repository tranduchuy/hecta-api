var express = require('express');
var router = express.Router();

var users = require('../routes/users');
var index = require('../routes/index');
var sales = require('../routes/sales');
var images = require('../routes/images');




router.use('/', index);
router.use('/files/js/', express.static('files/js'));


router.use('/api/v1/users', users);
router.use('/api/v1/sales', sales);
router.use('/api/v1/images', images);




module.exports = router;