const router = require('express').Router();
const { ValidationError } = require('express-json-validator-middleware');

router.use('/repeating', require('./repeating.js'));
router.use('/single', require('./single.js'));
router.use('/future', require('./future.js'));

router.use((error, request, response, next) => {
  if (error instanceof ValidationError) {
    return response.status(400).send(error.validationErrors);
  }

  return next(error);
});

router.use((error, req, res) => {
  let output = req.databag.output;

  if (error.isUserError === true) {
    output.message = 'Request Failed';
    output.error = error.message;
    return res.status(400).send(output);
  }

  output.message = 'Request Errored';
  output.error = error.message;
  return res.status(500).send(output);
});

module.exports = router;
