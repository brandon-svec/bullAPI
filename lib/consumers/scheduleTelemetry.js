const Ajv = require('ajv');
const config = require('config');
const path = require('path');
const pino = require('pino');
const request = require('request');

const scheduler = require(path.resolve('lib', 'scheduler'));

const ajv = new Ajv({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    datatype: {
      type: 'string'
    }
  },
  required: []
};

module.exports = {
  Init,
  ProcessWork,
  GetSchema
};

function GetSchema () {
  return schema;
}

function Init (cb) {
  return cb();
}

function ProcessWork (jobObject, cb) {
  let validationError = validateSchema(jobObject.data.payload);
  if (validationError) {
    return cb(validationError, null, 'REJECT');
  }

  return executeWork(jobObject, cb);
}

function executeWork (jobObject, cb) {
  var coeff = 1000 * 60 * 5; // 5 Minutes
  var now = new Date();
  let endTime = new Date(Math.floor(now.getTime() / coeff) * coeff);
  let startTime = new Date(endTime.getTime() - coeff);

  let payload = {
    startTime,
    endTime
  };

  return scheduler.AddSingleJob('gatherTelemetry', endTime.toISOString(), payload, cb);
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    return new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
