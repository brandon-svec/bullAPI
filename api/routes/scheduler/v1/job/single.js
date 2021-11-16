const { Validator } = require('express-json-validator-middleware');
const path = require('path');
const router = require('express').Router();

const schemas = require('./schema.js').single;
const scheduler = require(path.resolve('lib', 'scheduler'));

const validator = new Validator({ allErrors: true, useDefaults: true });
const { validate } = validator;

router.post('/', validate({ body: schemas.post }), (req, res, next) => {
  scheduler.AddSingleJob(req.body.queue, req.body.uniqueName, req.body.payload, function (err) {
    if (err) {
      return next(err);
    }

    req.databag.output.message = 'Request Successful';
    return res.status(200).send(req.databag.output);
  });
});

module.exports = router;
