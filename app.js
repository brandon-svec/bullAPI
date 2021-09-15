// External
const http = require('http');
const https = require('https');
const pino = require('pino');
const fs = require('fs');
const async = require('async');
const config = require('config');
const path = require('path');

// Internal

const consumer = require(path.resolve('lib', 'consumer'));
const cronGenerator = require(path.resolve('lib', 'cronGenerator'));
const scheduler = require(path.resolve('lib', 'scheduler'));
const webServerConfig = require('./lib/webserver');

// Global

const log = pino(config.get('logging'));

// Express

var app = webServerConfig.GetWebServerConfig(config, log);

var server = null;

// Start

init();

// Functions

function init () {
  log.info('Starting Service...');

  async.waterfall([
    initConsumer,
    initCronGenerator,
    initScheduler,
    initHTTPserver
  ],
  function (err, result) {
    if (err) {
      log.error('Service Failed to Start');
    } else {
      log.info('Service Started');
    }
  });
}

function initCronGenerator (cb) {
  cronGenerator.Init(function (err) {
    if (err) {
      log.fatal({ Error: err.message }, 'Cron Generator Initialization Failed');
      return cb(err);
    }

    log.info('Cron Generator Initialized');
    return cb();
  });
}

function initScheduler (cb) {
  scheduler.Init(function (err) {
    if (err) {
      log.fatal({ Error: err.message }, 'Scheduler Initialization Failed');
      return cb(err);
    }

    log.info('Scheduler Initialized');
    return cb();
  });
}

function initConsumer (cb) {
  consumer.Init(function (err) {
    if (err) {
      log.fatal({ Error: err.message }, 'Consumer Initialization Failed');
      return cb(err);
    }

    log.info('Consumer Initialized');
    return cb();
  });
}

function initHTTPserver (cb) {
  if (server) {
    server.close();
  }

  // SSL HTTP Server
  var sslOptions = null;
  if (config.get('ssl')) {
    sslOptions = {
      pfx: fs.readFileSync(config.get('ssl.pfx')),
      passphrase: config.get('ssl.passphrase')
    };
  }

  if (sslOptions) {
    server = https.createServer(sslOptions, app);
  } else {
    server = http.createServer(app);
  }

  server.listen(config.get('http.port'), config.get('http.server'), function (err) {
    if (err) {
      log.error({ Error: err }, 'HTTP Server Failure');
    } else {
      log.info('HTTP Server Success');
    }

    return cb(err);
  });
  server.timeout = 0;
}

process.on('SIGINT', () => {
  // Pause the local queues, complete all existing work, then exit
  Promise.all([

  ]).then(() => process.exit(0));
});
