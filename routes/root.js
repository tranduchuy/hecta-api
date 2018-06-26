var express = require('express');
var router = express.Router();

var users = require('../routes/users');
var index = require('../routes/index');
var sales = require('../routes/sales');
var images = require('../routes/images');
var buys = require('../routes/buys');
var search = require('../routes/search');
var posts = require('../routes/posts');
var projects = require('../routes/projects');
var script = require('../routes/script');
var news = require('../routes/news');


router.use('/', index);
router.use('/files/js/', express.static('files/js'));


router.use('/api/v1/users', users);
router.use('/api/v1/sales', sales);
router.use('/api/v1/images', images);
router.use('/api/v1/buys', buys);
router.use('/api/v1/search', search);
router.use('/api/v1/posts', posts);
router.use('/api/v1/projects', projects);
router.use('/api/v1/script', script);
router.use('/api/v1/news', news);


module.exports = router;