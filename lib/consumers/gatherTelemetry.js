const Ajv = require('ajv');
const path = require('path');

const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const executePennyWorkflow = require(path.resolve('lib', 'actions', 'executePennyWorkflow'));

const ajv = new Ajv({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    startTime: {
      type: 'string'
    },
    endTime: {
      type: 'string'
    },
    databaseName: {
      type: 'string'
    },
    dbid: {
      type: 'number'
    },
    stackid: {
      type: 'number'
    },
    name: {
      type: 'string'
    }
  },
  required: ['startTime', 'endTime', 'databaseName', 'dbid', 'stackid', 'name']
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
  return executePennyWorkflow.Execute(jobObject.data.payload.name, jobObject.data.payload, cb);
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
