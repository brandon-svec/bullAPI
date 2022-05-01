const Ajv = require('ajv');
const ajv = new Ajv({ useDefaults: true });
const path = require('path');

const consumer = require(path.resolve('lib', 'consumer'));

module.exports = function (req, res, next) {
  const schema = consumer.GetSchema(req.params.queue);

  if (!schema) {
    return res.status(404).sendWrappedFailure(new Error('Queue Not Found'));
  }

  try {
    validateSchema(schema, req.body.payload);
  } catch (err) {
    return res.status(400).sendWrappedFailure(err);
  }

  return next();
};

function validateSchema (schema, payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
