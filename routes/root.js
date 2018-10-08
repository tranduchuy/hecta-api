const express = require('express');
const router = express.Router({});
const PostController = require('../controller/PostController');
const SearchController = require('../controller/SearchController');
const users = require('../routes/users');
const index = require('../routes/index');
const sales = require('../routes/sales');
const images = require('../routes/images');
const buys = require('../routes/buys');
const projects = require('../routes/projects');
const script = require('../routes/script');
const news = require('../routes/news');
const admin = require('../routes/admin');
const tags = require('../routes/tags');
const vips = require('../routes/vips');
const notify = require('../routes/notify');
const system = require('../routes/system');

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
router.use('/api/v1/systems', system);
router.use('/admin/v1/', admin);

router.get('/api/v1/posts/child/:id', PostController.child);
router.get('/api/v1/posts/latest', PostController.latest);
router.get('/api/v1/posts/top/city', PostController.topCity);
router.get('/api/v1/posts/detail/:id', PostController.detail);
router.get('/api/v1/posts/list', PostController.list);

router.get('/api/v1/search/', SearchController.search2);
router.post('/api/v1/search/box', SearchController.filter);


module.exports = router;