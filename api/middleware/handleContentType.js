module.exports = function (req, res, next) {
  const contentType = req.headers['content-type'];
  if (!contentType || contentType.indexOf('application/json') !== 0) {
    return res.sendWrappedFailure(new Error('Content-Type must be application/json'));
  }

  return next();
};
