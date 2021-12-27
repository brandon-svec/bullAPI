const Ajv = require('ajv');
const path = require('path');

const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const executePennyWorkflow = require(path.resolve('lib', 'actions', 'executePennyWorkflow'));

const ajv = new Ajv({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    parameters: {
      type: 'object',
      default: {}
    }
  },
  required: ['name', 'parameters']
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
  try {
    validateSchema(jobObject.data.payload);
  } catch (err) {
    let eErr = new EnhancedError(err.message, true);
    return cb(eErr);
  }

  return executeWork(jobObject, cb);
}

function executeWork (jobObject, cb) {
  return executePennyWorkflow.Execute(jobObject.data.payload.name, jobObject.data.payload.parameters, cb);
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
