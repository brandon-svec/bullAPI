// External Imports
const express = require('express');
const path = require('path');

// Internal Imports

// Routes

const handleContentType = require(path.resolve('api', 'middleware', 'handleContentType'));
const req_prime = require(path.resolve('api', 'middleware', 'req_prime'));

const healthcheck = require(path.resolve('api', 'routes', 'healthCheck'));
const scheduler_v1_job = require(path.resolve('api', 'routes', 'scheduler', 'v1', 'job'));
// const swagger = require(path.resolve('swagger', 'swagger'));

// Express

function GetWebServerConfig () {
  const app = express();

  app.use(express.urlencoded({
    extended: true
  }));

  app.use(req_prime.run);

  app.get('/', healthcheck);
  // app.use('/swagger', require(swagger));

  app.post('*', handleContentType.run);

  app.post('*', express.json({
    limit: '1mb'
  }));

  // Routes

  app.use('/scheduler/v1/job', scheduler_v1_job);

  return app;
}

// Internal

// Exports

module.exports = {
  GetWebServerConfig
};
