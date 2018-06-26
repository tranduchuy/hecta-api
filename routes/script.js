var express = require('express');
var router = express.Router();

var ScriptController = require('../controller/ScriptController');

router.get('/generate/url', ScriptController.generateUrl);


module.exports = router;
