const { Validator } = require('express-json-validator-middleware');
const path = require('path');
const router = require('express').Router();

const queueCheck = require(path.resolve('api', 'middleware', 'queueCheck'));
const schemas = require('./schema.js').future;
const scheduler = require(path.resolve('lib', 'scheduler'));

const validator = new Validator({ allErrors: true, useDefaults: true });
const { validate } = validator;

router.post('/:queue/', validate({ body: schemas.post }), queueCheck, (req, res, next) => {
  scheduler.AddFutureJob(req.params.queue, req.body.uniqueName, req.body.payload, req.body.delaySec, function (err) {
    if (err) {
      return next(err);
    }

    return res.sendWrappedSuccess();
  });
});

module.exports = router;
