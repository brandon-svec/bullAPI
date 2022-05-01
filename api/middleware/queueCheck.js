const Ajv = require('ajv');
const ajv = new Ajv({ useDefaults: true });
const path = require('path');

const consumer = require(path.resolve('lib', 'consumer'));

module.exports = function (req, res, next) {
  const output = req.databag.output;
  const schema = consumer.GetSchema(req.params.queue);

  if (!schema) {
    output.message = 'Request Failed';
    output.error = 'Queue Not Found';
    return res.status(404).send(output);
  }

  try {
    validateSchema(schema, req.body.payload);
  } catch (err) {
    output.message = 'Request Failed';
    output.error = err.message;
    return res.status(400).send(output);
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
