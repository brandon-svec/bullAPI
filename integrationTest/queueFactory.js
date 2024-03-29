process.env.NODE_ENV = 'integrationTest';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const config = require('config');
const path = require('path');

const queueFactory = require(path.resolve('lib', 'queueFactory'));

describe('Queue Factory', function () {
  describe('Initializaiton', function () {
    it('Initialization', function (done) {
      queueFactory.Init(function (err) {
        return done(err);
      });
    });
  });

  describe('Get Queue', function () {
    it('Get Default Queue', function (done) {
      const queue = queueFactory.GetQueue();
      assert.isObject(queue);
      assert.equal(queue.name, 'default');
      assert.isTrue(queue.clientInitialized);
      done();
    });

    it('Get Custom Queue', function (done) {
      const queue = queueFactory.GetQueue('myQueue');
      assert.isObject(queue);
      assert.equal(queue.name, 'myQueue');
      assert.deepEqual(queue.limiter, {
        max: 1,
        duration: 10000
      });
      assert.equal(queue.settings.retryProcessDelay, 5000);
      assert.isTrue(queue.clientInitialized);
      done();
    });
  });

  describe('Queue Exists', function () {
    it('Check Default Queue', function (done) {
      assert.isTrue(queueFactory.Exists('default'));
      done();
    });

    it('Check Missing Queue', function (done) {
      assert.isFalse(queueFactory.Exists('doesNotExist'));
      done();
    });
  });

  describe('GetQueueOpts', function () {
    it('Tries invalid type', function (done) {
      try {
        const opts = queueFactory.GetQueueOpts('test');
        opts.createClient('notValid', null);
      } catch (err) {
        assert.equal(err.message, 'Unexpected connection type: notValid');
        return done();
      }
    });

    it('Creates bclient', function (done) {
      const opts = queueFactory.GetQueueOpts('test');
      opts.createClient('bclient', config.get('redis'));
      done();
    });
  });

  describe('Shutdown', function () {
    it('Shutsdown gracefully', function (done) {
      queueFactory.Shutdown(done);
    });
  });
});
