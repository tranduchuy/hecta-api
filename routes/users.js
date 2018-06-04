var express = require('express');
var router = express.Router();

var UserController = require('../controller/UserController');


router.post('/check', UserController.check);
router.post('/login', UserController.login);
router.post('/register', UserController.register);

module.exports = router;
