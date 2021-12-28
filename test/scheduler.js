process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const path = require('path');
const sinon = require('sinon');
const tk = require('timekeeper');

const scheduler = require(path.resolve('lib', 'scheduler'));
const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));

describe('Scheduler', function () {
  describe('Init', function () {
    it('Initializes Successfully', function (done) {
      let stub = sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
        return setImmediate(cb);
      });

      scheduler.Init(function (err) {
        assert.notExists(err);
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });

    it('Initialize Fails', function (done) {
      let stub = sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
        return setImmediate(cb, new Error('Something Broke'));
      });

      scheduler.Init(function (err) {
        assert.exists(err);
        assert.equal(err.message, 'Something Broke');
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });
  });

  describe('Add Jobs', function () {
    before(function () {
      var time = new Date('2021-12-27 18:00:00');
      tk.freeze(time);
    });

    after(function () {
      tk.reset();
    });

    describe('AddSingleJob', function () {
      afterEach(function () {
        sinon.restore();
      });

      it('Add Successfully', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, null, null, null);

        scheduler.AddSingleJob('default', 'test', {}, function (err) {
          assert.isUndefined(err);
          assert.isTrue(stub.calledOnce);
          done();
        });
      });

      it('Add Fails', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, null, null, 'Something Broke');

        scheduler.AddSingleJob('default', 'test', {}, function (err) {
          try {
            assert.isNotNull(err);
            assert.equal(err.message, 'Something Broke');
            assert.isTrue(stub.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});

function createAddJobStub (envTest, optTest, response, err) {
  return sinon.stub(queueFactory, 'GetQueue').callsFake(function () {
    return {
      add: function (envelope, options) {
        assert.isObject(envelope);
        assert.deepEqual(envelope, envTest);
        assert.isObject(options);

        if (optTest) {
          assert.deepEqual(options, optTest);
        }

        if (err) {
          return Promise.reject(new Error(err));
        }

        if (response) {
          return Promise.resolve(response);
        }

        return Promise.resolve();
      }
    };
  });
}
