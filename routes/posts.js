const express = require('express');
const router = express.Router({});
const PostController = require('../controller/PostController');

router.get('child/:id', PostController.child);
router.get('latest', PostController.latest);
router.get('top/city', PostController.topCity);
router.get('detail/:id', PostController.detail);
router.get('list', PostController.list);


module.exports = router;
