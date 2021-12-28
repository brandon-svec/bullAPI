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
        }, {
          jobId: 'test',
          removeOnComplete: true
        }, null, null);

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
        }, {
          jobId: 'test',
          removeOnComplete: true
        }, null, 'Something Broke');

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

    describe('AddFutureJob', function () {
      afterEach(function () {
        sinon.restore();
      });

      it('Add Successfully', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          delay: 60000,
          removeOnComplete: true
        }, null, null);

        scheduler.AddFutureJob('default', 'test', {}, 60, function (err) {
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
        }, {
          jobId: 'test',
          delay: 60000,
          removeOnComplete: true
        }, null, 'Something Broke');

        scheduler.AddFutureJob('default', 'test', {}, 60, function (err) {
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

    describe('AddRepeatingJob', function () {
      afterEach(function () {
        sinon.restore();
      });

      it('Add Successfully', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          repeat: {
            cron: '*/5 * * * *'
          },
          removeOnComplete: true
        }, '*/5 * * * *', null, [{ id: 'notTest' }]);

        let qfExists = sinon.stub(queueFactory, 'Exists').callsFake(function (queue) {
          assert.equal(queue, 'default');
          return true;
        });

        scheduler.AddRepeatingJob('default', 'test', {}, 5, function (err) {
          try {
            assert.isNull(err);
            assert.equal(stub.callCount, 2);
            assert.isTrue(qfExists.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('Add Fails - Get Job', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          repeat: {
            cron: '*/5 * * * *'
          },
          removeOnComplete: true
        }, '*/5 * * * *', null, [], 'Something Broke w/ jobs');

        let qfExists = sinon.stub(queueFactory, 'Exists').callsFake(function (queue) {
          assert.equal(queue, 'default');
          return true;
        });

        scheduler.AddRepeatingJob('default', 'test', {}, 5, function (err) {
          try {
            assert.isNotNull(err);
            assert.equal(err.message, 'Something Broke w/ jobs');
            assert.isTrue(stub.calledOnce);
            assert.isTrue(qfExists.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('Add Fails - Queue Not Found', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          repeat: {
            cron: '*/5 * * * *'
          },
          removeOnComplete: true
        }, '*/5 * * * *', null, []);

        let qfExists = sinon.stub(queueFactory, 'Exists').callsFake(function (queue) {
          assert.equal(queue, 'default');
          return false;
        });

        scheduler.AddRepeatingJob('default', 'test', {}, 5, function (err) {
          try {
            assert.isNotNull(err);
            assert.equal(err.message, 'Queue Not Found');
            assert.equal(stub.callCount, 0);
            assert.isTrue(qfExists.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('Add Fails', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          repeat: {
            cron: '*/5 * * * *'
          },
          removeOnComplete: true
        }, null, 'Something Broke', []);

        let qfExists = sinon.stub(queueFactory, 'Exists').callsFake(function (queue) {
          assert.equal(queue, 'default');
          return true;
        });

        scheduler.AddRepeatingJob('default', 'test', {}, 5, function (err) {
          try {
            assert.isNotNull(err);
            assert.equal(err.message, 'Something Broke');
            assert.equal(stub.callCount, 2);
            assert.isTrue(qfExists.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('Job Already Exists', function (done) {
        let stub = createAddJobStub({
          createdDate: new Date('2021-12-27 18:00:00'),
          payload: {},
          name: 'test',
          version: 1
        }, {
          jobId: 'test',
          repeat: {
            cron: '*/5 * * * *'
          },
          removeOnComplete: true
        }, '*/5 * * * *', null, [{ id: 'test' }]);

        let qfExists = sinon.stub(queueFactory, 'Exists').callsFake(function (queue) {
          assert.equal(queue, 'default');
          return true;
        });

        scheduler.AddRepeatingJob('default', 'test', {}, 5, function (err) {
          try {
            assert.isNotNull(err);
            assert.equal(err.message, 'Job Already Exists');
            assert.equal(stub.callCount, 1);
            assert.isTrue(qfExists.calledOnce);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});

function createAddJobStub (envTest, optTest, response, err, getReatingJobsResponse, getRepeatingJobsError) {
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
      },
      getRepeatableJobs: function () {
        if (getRepeatingJobsError) {
          return Promise.reject(new Error(getRepeatingJobsError));
        }

        return Promise.resolve(getReatingJobsResponse);
      }
    };
  });
}
