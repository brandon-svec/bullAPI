const { Validator } = require('express-json-validator-middleware');
const path = require('path');
const router = require('express').Router();

const schemas = require('./schema.js').repeating;
const scheduler = require(path.resolve('lib', 'scheduler'));

const validator = new Validator({ allErrors: true, useDefaults: true });
const { validate } = validator;

router.post('/', validate({ body: schemas.post }), (req, res) => {
  scheduler.AddRepeatingJob(req.body.queue, req.body.uniqueName, req.body.data, req.body.intervalMinutes, function (err, schedule) {
    if (err) {
      return next(err);
    }

    req.databag.output.message = 'Request Successful';
    req.databag.output.schedule = schedule;
    return res.status(200).send(req.databag.output);
  });
});

module.exports = router;
