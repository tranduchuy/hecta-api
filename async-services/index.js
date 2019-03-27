require('../web/config/def');
// config log4js
const log4js = require('log4js');
log4js.configure('./config/log4js.json');

require('../web/database/db')(() => {
  console.log('Connect to mongo successfully');

  // require('./tasks/update-ad-rank')();
  // require('./test/update-ad-rank');
  require('./tasks/insert-view-stat')();
  require('./test/insert-view-stat');
});