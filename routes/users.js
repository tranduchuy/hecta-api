var express = require('express');
var router = express.Router();

var UserController = require('../controller/UserController');

router.get('/highlight', UserController.highlight);

router.post('/check', UserController.check);
router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.post('/confirm', UserController.confirm);
router.post('/confirm/resend', UserController.resendCofirm);
router.post('/child/register', UserController.registerChild);
router.post('/update', UserController.update);
router.post('/child/request/:id', UserController.childRequest);
router.post('/child/response/:id', UserController.childResponse);
router.post('/child/credit/share/:id', UserController.creditShare);
router.post('/child/remove/:id', UserController.childRemove);

router.get('/children', UserController.childList);
router.get('/request/list', UserController.requestList);
router.get('/child/detail/:id', UserController.childDetail);
router.get('/find/:email', UserController.findUserByEmail);
router.get('/balance', UserController.balance);

module.exports = router;
