process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const config = require('config');
const path = require('path');
const pino = require('pino');
const sinon = require('sinon');
const request = require('supertest');

const scheduler = require(path.resolve('lib', 'scheduler'));
const webServerConfig = require(path.resolve('lib', 'webserver'));

const log = pino(config.get('logging'));

const app = webServerConfig.GetWebServerConfig(config, log);

var client = null;

describe('HTTP Tests', function () {
  before(function (cb) {
    client = request(app);
    setImmediate(cb);
  });

  describe('Health Check', function () {
    it('Responds to healthcheck', function (done) {
      client
        .get('/')
        .expect(200, done);
    });
  });

  describe('Scheduler', function () {
    describe('Single', function () {
      afterEach(function () {
        sinon.restore();
      });

      it('Add Single Job Successfully', function (done) {
        const data = {
          payload: {
            b: 'bat'
          }
        };

        const stub = sinon.stub(scheduler, 'AddSingleJob').callsFake(function (queue, name, payload, cb) {
          assert.equal(queue, 'default');
          assert.equal(name, null);
          assert.deepEqual(payload, data.payload);
          return setImmediate(cb);
        });

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(200)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Successful');
            assert.isTrue(stub.calledOnce);
            done();
          });
      });

      it('Add Single Job Successfully w/ unique name', function (done) {
        const data = {
          payload: {
            b: 'bat'
          },
          uniqueName: 'myTestName'
        };

        const stub = sinon.stub(scheduler, 'AddSingleJob').callsFake(function (queue, name, payload, cb) {
          assert.equal(queue, 'default');
          assert.equal(name, 'myTestName');
          assert.deepEqual(payload, data.payload);
          return setImmediate(cb);
        });

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(200)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Successful');
            assert.isTrue(stub.calledOnce);
            done();
          });
      });

      it('Failed with bad queue', function (done) {
        const data = {
        };

        client
          .post('/scheduler/v1/job/single/doesNotExist')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(404)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.equal(res.body.error, 'Queue Not Found');
            done();
          });
      });

      it('Failed with bad base schema - string', function (done) {
        const data = 'stringData';

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.deepEqual(res.body, {});
            done();
          });
      });

      it('Failed with bad base schema - extra fields', function (done) {
        const data = {
          a: 'apple'
        };

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.deepEqual(res.body.error,
              {
                dataPath: '',
                keyword: 'additionalProperties',
                message: 'should NOT have additional properties',
                params: {
                  additionalProperty: 'a'
                },
                schemaPath: '#/additionalProperties'
              });
            done();
          });
      });
    });
  });
});
