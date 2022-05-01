const config = require('config');
const pino = require('pino');

const log = pino(config.get('logging'));

module.exports = function (req, res, next) {
  req.on('error', processError);

  res.on('error', processError);
  res.on('finish', processFinish);

  return next();

  function processFinish () {
    const logObj = buildLog();
    const statusCode = logObj.http.statusCode;

    if (statusCode >= 200 && statusCode < 400) {
      if (req.path !== '/') {
        log.info(logObj, 'HTTP Request Complete');
      }
    } else if (statusCode >= 400 && statusCode < 500) {
      log.warn(logObj, 'HTTP Request Failed');
    } else if (statusCode >= 500) {
      log.error(logObj, 'HTTP Request Errored');
    }
  }

  function processError (err) {
    const logObj = buildLog();
    logObj.error = err.message;

    switch (err.message) {
      case 'aborted':
        log.warn(logObj, 'Request Aborted');
        break;
      default:
        log.error(logObj, 'Request Errored');
    }
  }

  function buildLog () {
    let logObj = {
      attributes: res.databag.attributes,
      http: {},
      requestId: res.databag.id,
      route: req.path,
      telemetry: res.databag.telemetry,
      timeTakenMS: Date.now() - res.databag.startTime
    };

    logObj = Object.assign(logObj, res.databag.logData);
    logObj.http = Object.assign(logObj.http, res.databag.http);

    if (res.headersSent === true) {
      logObj.http.statusCode = res.statusCode;
    }

    if (req.body) {
      logObj.http.requestSize = JSON.stringify(req.body).length;
    }

    return logObj;
  }
};
