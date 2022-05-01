const config = require('config');

module.exports = function (req, res, next) {
  setInterval(function () {
    res.timedout = true;
    return res.status(408).sendWrappedFailure(new Error(`Request Timeout. Exceeded ${config.get('http.timeout')} ms.`));
  }, config.get('http.timeout'));

  return next();
};
