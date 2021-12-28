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
      let queue = queueFactory.GetQueue();
      assert.isObject(queue);
      assert.equal(queue.name, 'default');
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
        let opts = queueFactory.GetQueueOpts('test');
        opts.createClient('notValid', null);
      } catch (err) {
        assert.equal(err.message, 'Unexpected connection type: notValid');
        return done();
      }
    });

    it('Creates bclient', function (done) {
      let opts = queueFactory.GetQueueOpts('test');
      opts.createClient('bclient', config.get('redis'));
      done();
    });
  });

  describe('Shutdown', function(){
      it('Shutsdown gracefully', function(done){
          queueFactory.Shutdown(done);
      })
  })
});
