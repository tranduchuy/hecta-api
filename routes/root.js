var express = require('express');
var router = express.Router();

var PostController = require('../controller/PostController');
var SearchController = require('../controller/SearchController');


var users = require('../routes/users');
var index = require('../routes/index');
var sales = require('../routes/sales');
var images = require('../routes/images');
var buys = require('../routes/buys');
var projects = require('../routes/projects');
var script = require('../routes/script');
var news = require('../routes/news');
var admin = require('../routes/admin');
var tags = require('../routes/tags');
var vips = require('../routes/vips');
var notify = require('../routes/notify');


router.use('/', index);
router.use('/files/js/', express.static('files/js'));


router.use('/api/v1/users', users);
router.use('/api/v1/sales', sales);
router.use('/api/v1/images', images);
router.use('/api/v1/buys', buys);
router.use('/api/v1/projects', projects);
router.use('/api/v1/tags', tags);
router.use('/api/v1/script', script);
router.use('/api/v1/news', news);
router.use('/api/v1/vips', vips);
router.use('/api/v1/notifies', notify);

router.use('/admin/v1/', admin);

router.get('/api/v1/posts/child/:id', PostController.child);
router.get('/api/v1/posts/latest', PostController.latest);
router.get('/api/v1/posts/top/city', PostController.topCity);
router.get('/api/v1/posts/detail/:id', PostController.detail);
router.get('/api/v1/posts/list', PostController.list);

router.get('/api/v1/search/', SearchController.search2);
router.post('/api/v1/search/box', SearchController.filter);




module.exports = router;