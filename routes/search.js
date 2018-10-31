const express = require('express');
const router = express.Router({});
const SearchController = require('../controller/SearchController');

router.get('search/', SearchController.search);
router.post('search/box', SearchController.filter);

module.exports = router;