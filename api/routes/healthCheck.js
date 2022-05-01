module.exports = function (req, res, next) {
  res.setHeader('Content-type', 'text/html');
  return res.send('OK');
};
