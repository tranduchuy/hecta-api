const express = require('express');
const router = express.Router({});
const PostController = require('../controller/user/PostController');

router.get('/child/:id', PostController.child);
router.get('/latest', PostController.latest);
router.get('/top/city', PostController.topCity);
router.get('/detail/:id', PostController.detail);
router.get('/list', PostController.list);

router.post('/click-post-sale/:id', PostController.clickPostSale);


module.exports = router;
