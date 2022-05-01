const { Validator } = require('express-json-validator-middleware');
const path = require('path');
const router = require('express').Router();

const queueCheck = require(path.resolve('api', 'middleware', 'queueCheck'));
const schemas = require('./schema.js').repeating;
const scheduler = require(path.resolve('lib', 'scheduler'));

const validator = new Validator({ allErrors: true, useDefaults: true });
const { validate } = validator;

router.post('/:queue/', validate({ body: schemas.post }), queueCheck, (req, res, next) => {
  scheduler.AddRepeatingJob(req.params.queue, req.body.uniqueName, req.body.payload, req.body.intervalMinutes, function (err, schedule) {
    if (err) {
      return next(err);
    }

    return res.sendWrappedSuccess({ schedule });
  });
});

router.get('/:queue/', (req, res, next) => {
  scheduler.GetRepeatingJobs(req.params.queue, function (err, jobList) {
    if (err) {
      return next(err);
    }

    return res.sendWrappedSuccess({ jobList });
  });
});

router.delete('/:queue/:name', (req, res, next) => {
  scheduler.DeleteRepeatingJob(req.params.queue, req.params.name, function (err) {
    if (err) {
      return next(err);
    }

    return res.sendWrappedSuccess();
  });
});

module.exports = router;
