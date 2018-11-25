const express = require('express');
const router = express.Router({});
const TransactionController = require('../controller/TransactionController');
const PostPriorityController = require('../controller/PostPriorityController');
const AdminController = require('../controller/admin/AdminController');
const AdminUserController = require('../controller/admin/UserController');
const AdminProjectController = require('../controller/admin/ProjectController');
const AdminNewsController = require('../controller/admin/NewsController');
const AdminBuyController = require('../controller/admin/BuyController');
const AdminSaleController = require('../controller/admin/SaleController');
const AdminPostController = require('../controller/admin/PostController');
const AdminCategoryController = require('../controller/admin/CategoryController');
const AdminTagController = require('../controller/admin/TagController');
const AdminExcelController = require('../controller/admin/ExcelController');

router.get('/projects/types', AdminProjectController.typeList);

router.post('/projects/add', AdminProjectController.add);
router.post('/projects/update/:id', AdminProjectController.update);

router.get('/news/cats', AdminNewsController.catList);
router.post('/news/add', AdminNewsController.add);
router.post('/news/update/:id', AdminNewsController.update);


router.get('/posts/list', AdminPostController.list2);
router.get('/posts/detail/:id', AdminPostController.detail);
router.post('/posts/update/url/:id', AdminPostController.updateUrl);
router.delete('/posts/delete', AdminController.removePost);

router.post('/buys/update/:id', AdminBuyController.update);
router.post('/sales/update/:id', AdminSaleController.update);

router.post('/payments/add/:id', TransactionController.addMain);
router.post('/promos/add/:id', TransactionController.addPromo);

router.get('/users/list', AdminUserController.list);
router.post('/users/update/:id', AdminUserController.update);
router.put('/users/user-type/:id', AdminUserController.changeUserType);

router.get('/admins/list', AdminController.list);
router.post('/admins/create', AdminController.create);
router.post('/admins/update', AdminController.update);
router.post('/admins/login', AdminController.login);
router.post('/admins/status/:id', AdminController.status);

router.get('/vips/list', PostPriorityController.listAdmin);
router.post('/vips/update/:id', PostPriorityController.update);
router.post('/vips/add', PostPriorityController.add);

router.get('/categories/list', AdminCategoryController.list);
router.get('/categories/detail/:id', AdminCategoryController.detail);
router.post('/categories/update/:id', AdminCategoryController.update);

router.get('/tags/list', AdminTagController.list);
router.get('/tags/detail/:id', AdminTagController.detail);
router.post('/tags/update/:id', AdminTagController.update);

router['get']('/excels/user-buy', AdminExcelController.exportUserBuyContact);
router['get']('/excels/user-sale', AdminExcelController.exportUserSaleContact);
router['get']('/excels/user', AdminExcelController.exportUserSystem);

module.exports = router;
