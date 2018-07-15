var express = require('express');
var router = express.Router();

var UserController = require('../controller/UserController');

router.get('/highlight', UserController.highlight);

router.post('/check', UserController.check);
router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.post('/update', UserController.update);

module.exports = router;
