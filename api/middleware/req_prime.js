// Import External Modules

const uuid = require('node-uuid');
const config = require('config');
const pino = require('pino');
// Import Internal Modules

// Export

module.exports = {
  run: fn_run
};

// Configs

const log = pino(config.get('logging'));

// Init

// Routes

function fn_run (req, res, next) {
  req.id = uuid.v4();

  req.databag = {
    output: {
      requestId: req.id,
      message: ''
    },
    databag: {
      logData: {}
    }
  };

  req.requestTime = Date.now();

  // HTTP Request Error
  req.on('error', fn_request_processError);

  // HTTP Request Timeout
  setTimeout(fn_request_processTimeout, config.http.timeout);

  // HTTP Response Error
  res.on('error', fn_response_processError);

  // HTTP Connection Closed
  res.on('abort', fn_response_processClose);

  // Done
  next();

  // *** Local Functions ***

  function fn_request_processError (err) {
    var logObj = fn_buildLog(req, res);
    logObj.Error = err;

    log.error(logObj, 'Request Errored');
  }

  function fn_request_processTimeout () {
    if (!res.headersSent) {
      res.status(408).send('Request Timed Out');

      var logObj = fn_buildLog(req, res);
      logObj.Error = 'Request Timed Out';

      log.warn(logObj, 'Request Errored');
    }
  }

  function fn_response_processError (err) {
    var logObj = fn_buildLog(req, res);
    logObj.Error = err;

    log.error(logObj, 'Response Errored');
  }

  function fn_response_processClose () {
    var logObj = fn_buildLog(req, res);

    log.warn(logObj, 'Connection Closed');
  }
}

// Functions

function fn_buildLog (req, res) {
  var output = {};

  output.RequestID = req.id;
  if (res.headersSent) {
    output.statusCode = res.statusCode;
  }
  output.sourceIP = req.ip;
  output.timeTaken = Date.now() - req.requestTime;
  if (req.body) {
    output.requestSize = req.body.length;
  }
  output.route = req.path;

  if (res.body) {
    output.responseSize = res.body.length;
  }

  return output;
}
