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

    req.databag.output.message = 'Request Successful';
    req.databag.output.schedule = schedule;
    return res.status(200).send(req.databag.output);
  });
});

router.get('/:queue/', (req, res, next) => {
  scheduler.GetRepeatingJobs(req.params.queue, function (err, jobList) {
    if (err) {
      return next(err);
    }

    req.databag.output.message = 'Request Successful';
    req.datagab.output.jobList = jobList;
    return res.status(200).send(req.databag.output);
  });
});

router.delete('/:queue/:name', (req, res, next) => {
  scheduler.DeleteRepeatingJob(req.params.queue, req.params.name, function (err) {
    if (err) {
      console.log(err);
      return next(err);
    }

    req.databag.output.message = 'Request Successful';
    return res.status(200).send(req.databag.output);
  });
});

module.exports = router;
