process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const Ajv = require('ajv');
const assert = require('chai').assert;
const path = require('path');
const sinon = require('sinon');

const client = require(path.resolve('lib', 'consumers', 'scheduleTelemetry'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));
const scheduler = require(path.resolve('lib', 'scheduler'));

const ajv = new Ajv({ useDefaults: true });

describe('Consumer', function () {
  before(function () {
    sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
      return cb();
    });
  });

  after(function () {
    return sinon.restore();
  });

  describe('scheduleTelemetry.js', function () {
    describe('Init', function () {
      it('Initializes Successfully', function (done) {
        return client.Init(done);
      });
    });

    describe('GetSchema', function () {
      it('Checks Schema', function (done) {
        assert.isTrue(ajv.validateSchema(client.GetSchema()));
        done();
      });
    });

    describe('Process Work', function () {
      describe('Happy Path', function () {
        it('Process Work Successfully', function (done) {
          const jobObject = {
            timestamp: '2020-01-01 12:00:00',
            data: {
              payload: {
                datatype: 'emailActivity'
              }
            }
          };

          const stub = sinon.stub(scheduler, 'AddSingleJob').callsFake(function (queue, name, payload, cb) {
            // assert.equal(queue, 'processTelemetry_emailActivity');
            // assert.equal(name, `${dbObj.databaseName}_${startTime.toISOString()}`)
            return cb();
          });

          client.ProcessWork(jobObject, function (err) {
            assert.isNull(err);
            assert.equal(stub.callCount, 4);
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

        it('No Data Type', function (done) {
          const jobObject = {
            data: {
              payload: {}
            }
          };

          client.ProcessWork(jobObject, function (err, results) {
            assert.isNotNull(err);
            assert.equal(err.message, `undefined must have required property 'datatype' - {"missingProperty":"datatype"}`);
            assert.isTrue(err.isUserError);
            assert.isUndefined(results);
            return done();
          });
        });
      });
    });
  });
});
