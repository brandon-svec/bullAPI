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
  var global = req.app.locals;
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

  function fn_response_finish_logStatsD () {
    var logObj = fn_buildLog(req, res);

    var newPath = '';

    if (!global.registeredRoutes) {
      global.registeredRoutes = {};

      req.app._router.stack.forEach(function (r) {
        if (r.route && r.route.path) {
          global.registeredRoutes[r.route.path] = true;
        }
      });
    }

    if (global.registeredRoutes[req.path]) {
      newPath = req.path.replace('.', '');
    } else {
      newPath = 'Unregistered';
    }

    global.statsClient.increment('route.' + newPath + '.statuscode.' + logObj.statusCode);
    global.statsClient.timing('route.' + newPath + '.processTimeMS', logObj.timeTaken);
  }

  function fn_response_finish_logFile () {
    var logObj = fn_buildLog(req, res);

    if (req.databag.logData) {
      var keys = Object.keys(req.databag.logData);
      for (var c = 0; c < keys.length; c++) {
        logObj[keys[c]] = req.databag.logData[keys[c]];
      }
    }

    if (logObj.statusCode >= 200 && logObj.statusCode < 400) {
      if (req.path !== '/') {
        log.info(logObj, 'Request Complete');
      }
    } else if (logObj.statusCode >= 400 && res.statusCode < 500) {
      log.warn(logObj, 'Request Failed');
    } else if (logObj.statusCode >= 500) {
      log.error(logObj, 'Request Errored');
    }
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
