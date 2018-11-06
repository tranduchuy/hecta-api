const express = require('express');
const router = express.Router({});
const CityController = require('../controller/CityController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/selector', CityController.list);

module.exports = router;
