const express = require('express');
const router = express.Router();
const LeadController = require('../controller/user/lead/LeadController');

router.post('/customer-focus', LeadController.createLead);
router.post('/purchase', LeadController.buyLead);
router.get('/', LeadController.getListLead);

module.exports = router;