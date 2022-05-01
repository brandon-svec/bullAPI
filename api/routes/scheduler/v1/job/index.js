const router = require('express').Router();
const { ValidationError } = require('express-json-validator-middleware');

router.use('/repeating', require('./repeating.js'));
router.use('/single', require('./single.js'));
router.use('/future', require('./future.js'));

router.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    const ajv = err.validationErrors.body[0];
    return res.sendWrappedFailure(new Error(`${ajv.dataPath} ${ajv.message} - ${JSON.stringify(ajv.params)}`));
  }

  return next(err);
});

/* eslint-disable no-unused-vars */
router.use((err, req, res, next) => {
  if (err.isUserError === true) {
    return res.sendWrappedFailure(err);
  }

  return res.sendWrappedError(err);
});
/* eslint-enable no-unused-vars */

module.exports = router;
