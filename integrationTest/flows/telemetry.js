process.env.NODE_ENV = 'integrationTest';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const async = require('async');
const path = require('path');
const sinon = require('sinon');

const executePennyWorkflow = require(path.resolve('lib', 'actions', 'executePennyWorkflow'));
const scheduler = require(path.resolve('lib', 'scheduler'));

describe('Schedule Telemetry Workflow', function () {
  before(function (done) {
    scheduler.Init(done);
  });

  after(function () {
    sinon.restore();
  });

  it('Generates a telemetry request', function (done) {
    let correctCalls = [];

    let callPayload = {
      startTime: '2021-12-28T17:50:00.000Z',
      endTime: '2021-12-28T17:55:00.000Z',
      stackid: 2,
      dbid: 203,
      databaseName: 'ExactTarget203',
      name: 'processTelemetry_emailActivity',
      enterpriseList: '',
      env: 'test',
      sendNameList: '',
      datatype: 'emailActivity'
    };

    let pennyCalls = [];

    let spyGatherTelemetry = sinon.spy(scheduler, 'AddSingleJob').withArgs('gatherTelemetry');

    let stubExecutePennyWorkflow = sinon.stub(executePennyWorkflow, 'Execute').callsFake(function (name, params, cb) {
      pennyCalls.push(params);
      return cb();
    });

    scheduler.AddSingleJob('scheduleTelemetry', 'processTelemetry_test1', { datatype: 'emailActivity' }, function (err) {
      try {
        assert.isUndefined(err);

        async.retry({ times: 100, interval: 10 }, function (cb) {
          try {
            assert.equal(spyGatherTelemetry.callCount, 4);
            assert.equal(stubExecutePennyWorkflow.callCount, 4);
            return setImmediate(cb);
          } catch (err) {
            return setImmediate(cb, err);
          }
        }, done);
      } catch (err) {
        done(err);
      }
    });
  });
});
