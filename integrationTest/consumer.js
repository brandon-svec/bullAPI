process.env.NODE_ENV = 'integrationTest';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const path = require('path');
const sinon = require('sinon');

const consumer = require(path.resolve('lib', 'consumer'));
const defaultQueue = require(path.resolve('lib', 'consumers', 'default'));
const scheduler = require(path.resolve('lib', 'scheduler'));

describe('Consumer Integration Test', function () {
  before(function (done) {
    return consumer.Init(done);
  });

  before(function (done) {
    return scheduler.Init(done);
  });

  describe('Process Default', function () {
    it('Processes Default Queue Successfully', function (done) {
      let input = {
        a: 'apple',
        b: {
          c: 'charlie'
        }
      };

      let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function (jobObject, cb) {
        assert.equal(jobObject.data.name, 'test');
        assert.deepEqual(jobObject.data.payload, input);
        assert.exists(jobObject.data.createdDate);
        setImmediate(cb);
        stub.restore();
        done();
      });

      scheduler.AddSingleJob('default', 'test', input, function (err) {
        assert.isNull(err);
      });
    });
  });
});
