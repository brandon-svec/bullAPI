process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const Ajv = require('ajv');
const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const consumer = require(path.resolve('lib', 'consumer'));
const defaultQueue = require(path.resolve('lib', 'consumers', 'default'));
const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));

const ajv = new Ajv({ useDefaults: true });

const files = fs.readdirSync(path.resolve('lib', 'consumers'));

describe('Consumer Handler', function () {
  describe('Initialization', function () {
    before(function () {
      return sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
        return cb();
      });
    });

    before(function () {
      return sinon.stub(queueFactory, 'GetQueue').callsFake(function (name) {
        return {
          process: function () {

          }
        };
      });
    });

    after(function () {
      return sinon.restore();
    });

    it('Initializes Successfully', function (done) {
      return consumer.Init(done);
    });

    it('Read Dir Fails', function (done) {
      let stub = sinon.stub(fs, 'readdir').callsFake(function (dirpath, cb) {
        return setImmediate(cb, new Error('Something Broke'));
      });

      consumer.Init(function (err) {
        assert.isNotNull(err);
        assert.equal(err.message, 'Something Broke');
        stub.restore();
        done();
      });
    });

    it('Queue fails to Init - Callback', function (done) {
      let stub = sinon.stub(defaultQueue, 'Init').callsFake(function (cb) {
        return setImmediate(cb, new Error('Something Broke'));
      });

      consumer.Init(function (err) {
        assert.isNotNull(err);
        assert.equal(err.message, 'Something Broke');
        stub.restore();
        done();
      });
    });

    it('Queue fails to Init - throw', function (done) {
      let stub = sinon.stub(defaultQueue, 'Init').callsFake(function (cb) {
        throw new Error('Something Broke');
      });

      consumer.Init(function (err) {
        assert.isNotNull(err);
        assert.equal(err.message, 'Something Broke');
        stub.restore();
        done();
      });
    });

    it('QueueFactory Fails', function (done) {
      sinon.restore();
      sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
        return setImmediate(cb, new Error('Something Broke'));
      });

      consumer.Init(function (err) {
        assert.isNotNull(err);
        assert.equal(err.message, 'Something Broke');
        done();
      });
    });
  });

  describe('Get Schemas', function () {
    files.forEach(function (file) {
      describe(file, function () {
        let name = file.slice(0, -3);
        // const client = require(path.resolve('lib', 'consumers', file));
        it('Checks Schema', function (done) {
          assert.isTrue(ajv.validateSchema(consumer.GetSchema(name)));
          done();
        });
      });
    });

    it('Not Existent Consumer', function (done) {
      let schema = consumer.GetSchema('doesNotExist');
      assert.isNull(schema);
      done();
    });
  });

  describe('Exists', function () {
    it('Hit', function (done) {
      let exists = consumer.Exists('default');
      assert.isTrue(exists);
      done();
    });

    it('Miss', function (done) {
      let exists = consumer.Exists('doesNotExist');
      assert.isFalse(exists);
      done();
    });
  });

  describe('Process Work Handler', function () {
    let processHandler;

    before(function () {
      sinon.stub(queueFactory, 'GetQueue').callsFake(function (name) {
        return {
          process: function () {

          }
        };
      });

      processHandler = consumer.GenerateWorkHandler('default', defaultQueue);
    });

    after(function () {
      return sinon.restore();
    });

    it('Processes Successfully', function (done) {
      let input = {
        data: {
          payload: {
            a: 'alpha'
          }
        }
      };

      let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function (jobObject, cb) {
        assert.isObject(jobObject);
        assert.deepEqual(jobObject, input);
        return setImmediate(cb);
      });

      processHandler(input, function (err) {
        assert.isUndefined(err);
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });

    it('Temporary Error - Standard', function (done) {
      let input = {
        data: {
          payload: {
            a: 'alpha'
          }
        }
      };

      let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function (jobObject, cb) {
        assert.isObject(jobObject);
        assert.deepEqual(jobObject, input);
        return setImmediate(cb, new Error('Something Broke'));
      });

      processHandler(input, function (err) {
        assert.exists(err);
        assert.equal(err.message, 'Something Broke');
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });

    it('Temporary Error - Enhanced', function (done) {
      let input = {
        data: {
          payload: {
            a: 'alpha'
          }
        }
      };

      let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function (jobObject, cb) {
        assert.isObject(jobObject);
        assert.deepEqual(jobObject, input);
        return setImmediate(cb, new EnhancedError('Something Broke', false));
      });

      processHandler(input, function (err) {
        assert.exists(err);
        assert.equal(err.message, 'Something Broke');
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });

    it('Irrecoverable Error - Callback', function (done) {
      let input = {
        data: {
          payload: {
            a: 'alpha'
          }
        }
      };

      let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function (jobObject, cb) {
        assert.isObject(jobObject);
        assert.deepEqual(jobObject, input);
        return cb(new EnhancedError('Something Broke', true));
      });

      processHandler(input, function (err) {
        assert.isUndefined(err);
        assert.isTrue(stub.calledOnce);
        stub.restore();
        done();
      });
    });
  });
});
