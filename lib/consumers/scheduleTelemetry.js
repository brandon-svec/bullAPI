const Ajv = require('ajv');
const async = require('async');
const path = require('path');

const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const scheduler = require(path.resolve('lib', 'scheduler'));

const ajv = new Ajv({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    datatype: {
      type: 'string'
    }
  },
  required: ['datatype']
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
  try {
    validateSchema(jobObject.data.payload);
  } catch (err) {
    let eErr = new EnhancedError(err.message, true);
    return cb(eErr);
  }

  return executeWork(jobObject, cb);
}

function executeWork (jobObject, cb) {
  const coeff = 1000 * 60 * 5; // 5 Minutes
  const now = new Date(jobObject.timestamp); // Redis time of queued delayed job; Can be used as startTime
  const startTime = new Date(Math.floor(now.getTime() / coeff) * coeff);
  const endTime = new Date(startTime.getTime() + coeff);

  async.eachLimit(getTargetDatabasesByDataType(jobObject.data.payload.datatype), 5, function (dbObj, cb) {
    let payload = {
      startTime,
      endTime
    };

    payload = Object.assign(payload, dbObj);
    payload = Object.assign(payload, jobObject.data.payload);

    scheduler.AddSingleJob('gatherTelemetry', `${dbObj.databaseName}_${startTime.toISOString()}`, payload, cb);
  }, function (err) {
    return cb(err);
  });
}

function validateSchema (payload) {
  const schemaCheck = ajv.validate(schema, payload);

  if (!schemaCheck) {
    throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
  } else {
    return null;
  }
}

function getTargetDatabasesByDataType (datatype) {
  const dataTypeTemplate = {
    name: `processTelemetry_${datatype}`,
    enterpriseList: '',
    env: 'test'
  };

  switch (datatype) {
    case 'emailActivity':
      dataTypeTemplate['sendNameList'] = '';
      break;
  }

  let output = [];

  getDatabases().forEach(function (dbObj) {
    dbObj = Object.assign(dbObj, dataTypeTemplate);
    output.push(dbObj);
  });

  return output;
}

function getDatabases () {
  return [
    {
      stackid: 1,
      dbid: 101,
      databaseName: 'ExactTarget101'
    },
    {
      stackid: 2,
      dbid: 10102,
      databaseName: 'ExactTarget10102'
    },
    {
      stackid: 2,
      dbid: 200,
      databaseName: 'ExactTarget200'
    },
    {
      stackid: 2,
      dbid: 203,
      databaseName: 'ExactTarget203'
    }
  ];
}

/*
2,2,ETUser2
2,1000,ExactTarget1000
2,1001,ExactTarget1001
2,1002,ExactTarget1002
2,1003,ExactTarget1003
2,1004,ExactTarget1004
2,1005,ExactTarget1005
2,1006,ExactTarget1006
2,1007,ExactTarget1007
2,10099,ExactTarget10099
1,11,ETUser11
1,102,ExactTarget102
1,104,ExactTarget104
1,105,ExactTarget105
1,106,ExactTarget106
1,107,ExactTarget107
1,555,ExactTarget555
*/
