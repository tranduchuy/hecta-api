const express = require('express');
const router = express.Router();
const LeadController = require('../controller/lead/LeadController');

router.post('/customer-focus', LeadController.createLead);
router.get('/', LeadController.getListLead);

module.exports = router;
