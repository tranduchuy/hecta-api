const express = require('express');
const router = express.Router({});
const CityController = require('../controller/CityController');

router['get']('/selector', CityController.list);

module.exports = router;
