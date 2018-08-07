var express = require('express');
var router = express.Router();

var ProjectController = require('../controller/ProjectController');
var NewsController = require('../controller/NewsController');
var PostController = require('../controller/PostController');
var BuyController = require('../controller/BuyController');
var SaleController = require('../controller/SaleController');
var TransactionController = require('../controller/TransactionController');
var UserController = require('../controller/UserController');
var PostPriorityController = require('../controller/PostPriorityController');


router.get('/projects/list', ProjectController.list);
router.get('/projects/types', ProjectController.typeList);

router.post('/projects/add', ProjectController.add);
router.post('/projects/update/:id', ProjectController.update);
router.get('/projects/detail/:id', ProjectController.detail);

router.get('/news/list', NewsController.list);
router.get('/news/cats', NewsController.catList);

router.post('/news/add', NewsController.add);
router.post('/news/update/:id', NewsController.update);
router.get('/news/detail/:id', NewsController.detail);


router.get('/posts/list', PostController.listAdmin);
router.get('/posts/detail/:id', PostController.detailAdmin);


router.post('/buys/update/:id', BuyController.updateAdmin);
router.post('/sales/update/:id', SaleController.updateAdmin);

router.post('/payments/add/:id', TransactionController.addMain);
router.post('/promos/add/:id', TransactionController.addPromo);


router.get('/users/list', UserController.list);
router.get('/users/update/:id', UserController.updateAdmin);


router.get('/vips/list', PostPriorityController.listAdmin);
router.post('/vips/update/:id', PostPriorityController.update);
router.post('/vips/add', PostPriorityController.add);


module.exports = router;
