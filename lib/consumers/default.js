const Ajv = require('ajv');
const config = require('config');
const path = require('path');
const pino = require('pino');

const ajv = new Ajv({ useDefaults: true });
const log = pino(config.get('logging'));

const schema = {
  type: 'object',
  properties: {
  },
  required: []
};

module.exports = {
  Init,
  ProcessWork,
  GetSchema
};

function Init (cb) {
  return cb();
}

function GetSchema () {
  return schema;
}

function ProcessWork (jobObject, cb) {
  let validationError = validateSchema(jobObject.data.payload);
  if (validationError) {
    return cb(validationError, null, 'REJECT');
  }

  return executeWork(jobObject, cb);
}

function executeWork (jobObject, cb) {
  console.log(jobObject.data);
  log.info({ Queue: 'console', Payload: jobObject.data }, 'Default Queue Output');
  return cb(null, jobObject.data);
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
