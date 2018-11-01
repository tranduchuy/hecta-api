const express = require('express');
const router = express.Router({});
const SearchController = require('../controller/SearchController');

router.get('', SearchController.search);
router.post('box', SearchController.filter);

module.exports = router;