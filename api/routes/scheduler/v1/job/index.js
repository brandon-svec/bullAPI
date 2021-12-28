const router = require('express').Router();
const { ValidationError } = require('express-json-validator-middleware');

router.use('/repeating', require('./repeating.js'));
router.use('/single', require('./single.js'));
router.use('/future', require('./future.js'));

router.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    let output = req.databag.output;
    output.message = 'Request Failed';
    output.error = err.validationErrors.body[0];
    return res.status(400).send(output);
  }

  return next(err);
});

router.use((err, req, res, next) => {
  let output = req.databag.output;

  if (err.isUserError === true) {
    output.message = 'Request Failed';
    output.error = err.message;
    return res.status(400).send(output);
  }

  output.message = 'Request Errored';
  output.error = err.message;

  return res.status(500).send(output);
});

module.exports = router;
