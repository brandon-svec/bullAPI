const uuid = require('node-uuid');

module.exports = function (req, res, next) {
  res.databag = {
    id: uuid.v4(),
    logData: {
    },
    attributes: {},
    telemetry: {},
    startTime: Date.now(),
    http: {
      sourceIp: req.ip
    }
  };

  res.setHeader('Content-type', 'application/json');

  res.addLogData = function (fieldName, value) {
    res.databag.logData[fieldName] = value;
  };

  res.addAttribute = function (attr, value) {
    res.databag.attributes[attr] = value;
  };

  res.addTelemetry = function (source, value) {
    res.databag.telemetry[source] = value;
  };

  res.sendWrappedSuccess = function (obj = {}) {
    if (res.headersSent === true) return;
    let output = {
      requestId: res.databag.id,
      message: 'Request Successful'
    };

    output = Object.assign(output, obj);
    res.databag.http.responseSize = JSON.stringify(output).length;
    return this.status(200).send(output);
  };

  res.sendWrappedFailure = function (err) {
    if (res.headersSent === true) return;
    const output = {
      requestId: res.databag.id,
      message: 'Request Failed',
      error: err.message
    };

    if (res.statusCode === 200) {
      res.status(400);
    }

    res.databag.http.responseSize = JSON.stringify(output).length;
    return res.send(output);
  };

  res.sendWrappedError = function (err) {
    if (res.headersSent === true) return;
    const output = {
      requestId: res.databag.id,
      message: 'Request Errored',
      error: err.message
    };

    if (res.statusCode === 200) {
      res.status(500);
    }

    res.databag.http.responseSize = JSON.stringify(output).length;
    return res.send(output);
  };

  return next();
};
