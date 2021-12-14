const Ajv = require('ajv');
const path = require('path');

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
    }
  },
  required: ['startTime', 'endTime', 'databaseName', 'dbid', 'stackid']
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
  return executePennyWorkflow(jobObject.data.payload.name, jobObject.data.payload, cb);
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}
