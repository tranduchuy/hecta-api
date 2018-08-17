var express = require('express');
var router = express.Router();

// var ProjectController = require('../controller/ProjectController');

var TransactionController = require('../controller/TransactionController');
var PostPriorityController = require('../controller/PostPriorityController');

var AdminController = require('../controller/admin/AdminController');
var AdminUserController = require('../controller/admin/UserController');
var AdminProjectController = require('../controller/admin/ProjectController');
var AdminNewsController = require('../controller/admin/NewsController');
var AdminBuyController = require('../controller/admin/BuyController');
var AdminSaleController = require('../controller/admin/SaleController');
var AdminPostController = require('../controller/admin/PostController');

router.get('/projects/list', AdminProjectController.list);
router.get('/projects/types', AdminProjectController.typeList);

router.post('/projects/add', AdminProjectController.add);
router.post('/projects/update/:id', AdminProjectController.update);
router.get('/projects/detail/:id', AdminProjectController.detail);

router.get('/news/list', AdminNewsController.list);
router.get('/news/cats', AdminNewsController.catList);

router.post('/news/add', AdminNewsController.add);
router.post('/news/update/:id', AdminNewsController.update);
router.get('/news/detail/:id', AdminNewsController.detail);


router.get('/posts/list', AdminPostController.list);
router.get('/posts/detail/:id', AdminPostController.detail);


router.post('/buys/update/:id', AdminBuyController.update);
router.post('/sales/update/:id', AdminSaleController.updateAdmin);

router.post('/payments/add/:id', TransactionController.addMain);
router.post('/promos/add/:id', TransactionController.addPromo);


router.get('/users/list', AdminUserController.list);
router.post('/users/update/:id', AdminUserController.status);

router.get('/admins/list', AdminController.list);
router.post('/admins/create', AdminController.create);
router.post('/admins/update', AdminController.update);
router.post('/admins/login', AdminController.login);
router.post('/admins/status/:id', AdminController.status);


router.get('/vips/list', PostPriorityController.listAdmin);
router.post('/vips/update/:id', PostPriorityController.update);
router.post('/vips/add', PostPriorityController.add);


module.exports = router;
