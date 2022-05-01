// External Imports
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

// Express

function GetWebServerConfig () {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(require(path.resolve('api/middleware/primeResponse.js')));
  app.use(require(path.resolve('api/middleware/handleTimeout.js')));
  app.use(require(path.resolve('api/middleware/writeLog.js')));

  app.get('/', require(path.resolve('api/routes/healthCheck.js')));

  app.post('*', require(path.resolve('api/middleware/handleContentType.js')));

  app.post('*', express.json({
    limit: '1mb'
  }));

  // Routes

  app.use('/scheduler/v1/job', require(path.resolve('api/routes/scheduler/v1/job')));

  return app;
}

// Internal

// Exports

module.exports = {
  GetWebServerConfig
};
