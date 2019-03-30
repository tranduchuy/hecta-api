require('../web/config/def');
const express = require('express');
const log4js = require('log4js');
log4js.configure('./config/log4js.json');
const app = express();

require('./jobs/down-lead-price')();
require('./jobs/change-lead-status')();
module.exports = app;
