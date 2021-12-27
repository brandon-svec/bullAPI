process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const path = require('path');
const sinon = require('sinon');

const client = require(path.resolve('lib', 'consumers', 'gatherTelemetry'));
const executePennyWorkflow = require(path.resolve('lib', 'actions', 'executePennyWorkflow'));

describe('Consumer', function () {
  describe('gatherTelemetry.js', function () {
    describe('Init', function () {
      it('Initializes Successfully', function (done) {
        return client.Init(done);
      });
    });

    describe('Process Work', function () {
      describe('Happy Path', function () {
        it('Process Work Successfully', function (done) {
          const jobObject = {
            timestamp: '2020-01-01 12:00:00',
            data: {
              payload: {
                startTime: '2020-01-01 11:00:00',
                endTime: '2020-01-01 11:05:00',
                stackid: 1,
                dbid: 200,
                databaseName: 'ExactTarget200',
                name: 'processTelemetry_emailActivity'
              }
            }
          };

          const stub = sinon.stub(executePennyWorkflow, 'Execute').callsFake(function (workflowName, params, cb) {
            assert.equal(workflowName, jobObject.data.payload.name);
            assert.deepEqual(params, jobObject.data.payload);
            return cb(null, {
              requestId: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
              message: 'Request Successful',
              results: {
                tasks: {

                }
              }
            });
          });

          client.ProcessWork(jobObject, function (err, results) {
            assert.isNull(err);
            assert.isObject(results);
            assert.isTrue(stub.calledOnce);
            stub.restore();
            return done();
          });
        });
      });

      describe('Sad Path', function () {
        it('Payload is not an object', function (done) {
          const jobObject = {
            data: {
              payload: 'test'
            }
          };

          client.ProcessWork(jobObject, function (err, results) {
            assert.isNotNull(err);
            assert.equal(err.message, 'undefined must be object - {"type":"object"}');
            assert.isTrue(err.isUserError);
            assert.isUndefined(results);
            return done();
          });
        });

        it('No Empty Object', function (done) {
          const jobObject = {
            data: {
              payload: {}
            }
          };

          client.ProcessWork(jobObject, function (err, results) {
            assert.isNotNull(err);
            assert.equal(err.message, `undefined must have required property 'startTime' - {"missingProperty":"startTime"}`);
            assert.isTrue(err.isUserError);
            assert.isUndefined(results);
            return done();
          });
        });
      });
    });
  });
});
