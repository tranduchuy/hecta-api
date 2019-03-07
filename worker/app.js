const express = require('express');
const app = express();
require('./jobs/worker');
module.exports = app;
