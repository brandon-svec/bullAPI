process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const config = require('config');
const path = require('path');
const pino = require('pino');
const sinon = require('sinon');
const request = require('supertest');

const EnhancedError = require(path.resolve('lib', 'EnhancedError'));
const scheduler = require(path.resolve('lib', 'scheduler'));
const webServerConfig = require(path.resolve('lib', 'webserver'));

const log = pino(config.get('logging'));

const app = webServerConfig.GetWebServerConfig(config, log);

let client = null;

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

      it('Failed with bad content type', function (done) {
        const data = {
        };

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'not')
          .send(JSON.stringify(data))
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.equal(res.body.error, 'Content-Type must be application/json');
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
            assert.equal(res.body.error, ' should NOT have additional properties - {"additionalProperty":"a"}');
            done();
          });
      });

      it('Failed with bad queue schema', function (done) {
        const data = {
          payload: {
            testObject: 'notAnObject'
          }
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
            assert.equal(res.body.error, 'undefined must be object - {"type":"object"}');
            done();
          });
      });

      it('Error Returned', function (done) {
        const data = {
          payload: {
            b: 'bat'
          }
        };

        const stub = sinon.stub(scheduler, 'AddSingleJob').callsFake(function (queue, name, payload, cb) {
          return setImmediate(cb, new Error('Something Broke'));
        });

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(500)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Errored');
            assert.equal(res.body.error, 'Something Broke');
            assert.isTrue(stub.calledOnce);
            done();
          });
      });

      it('EnhancedError Returned', function (done) {
        const data = {
          payload: {
            b: 'bat'
          }
        };

        const stub = sinon.stub(scheduler, 'AddSingleJob').callsFake(function (queue, name, payload, cb) {
          return setImmediate(cb, new EnhancedError('Something Broke', true));
        });

        client
          .post('/scheduler/v1/job/single/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.equal(res.body.error, 'Something Broke');
            assert.isTrue(stub.calledOnce);
            done();
          });
      });

      it('Bad content-type', function (done) {
        client
          .post('/mirror')
          .set('Content-type', 'text')
          .send('input')
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body);
            assert.isObject(res.body);
            assert.isNotNull(res.body.message);
            assert.isNotNull(res.body.error);
            assert.equal(res.body.message, 'Request Failed');
            // eslint-disable-next-line
            assert.equal(res.body.error, 'Content-Type must be application/json');
            done();
          });
      });

      it('Bad content-type', function (done) {
        client
          .post('/mirror')
          .set('Content-type', 'text')
          .send('input')
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body);
            assert.isObject(res.body);
            assert.isNotNull(res.body.message);
            assert.isNotNull(res.body.error);
            assert.equal(res.body.message, 'Request Failed');
            // eslint-disable-next-line
            assert.equal(res.body.error, 'Content-Type must be application/json');
            done();
          });
      });
    });

    describe('Future', function () {
      afterEach(function () {
        sinon.restore();
      });

      it('Add Future Job Successfully', function (done) {
        const data = {
          payload: {
            b: 'bat'
          },
          delaySec: 60
        };

        const stub = sinon.stub(scheduler, 'AddFutureJob').callsFake(function (queue, name, payload, delay, cb) {
          assert.equal(queue, 'default');
          assert.equal(name, null);
          assert.deepEqual(payload, data.payload);
          assert.equal(delay, 60);
          return setImmediate(cb);
        });

        client
          .post('/scheduler/v1/job/future/default')
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

      it('Add Future Job Successfully w/ unique name', function (done) {
        const data = {
          payload: {
            b: 'bat'
          },
          uniqueName: 'myTestName',
          delaySec: 60
        };

        const stub = sinon.stub(scheduler, 'AddFutureJob').callsFake(function (queue, name, payload, delay, cb) {
          assert.equal(queue, 'default');
          assert.equal(name, 'myTestName');
          assert.deepEqual(payload, data.payload);
          assert.equal(delay, 60);
          return setImmediate(cb);
        });

        client
          .post('/scheduler/v1/job/future/default')
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
          delaySec: 60
        };

        client
          .post('/scheduler/v1/job/future/doesNotExist')
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
          .post('/scheduler/v1/job/future/default')
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
          .post('/scheduler/v1/job/future/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.equal(res.body.error, ' should NOT have additional properties - {"additionalProperty":"a"}');
            done();
          });
      });

      it('Failed with bad base schema - no delay', function (done) {
        const data = {
        };

        client
          .post('/scheduler/v1/job/future/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(400)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Failed');
            assert.equal(res.body.error, ' should have required property \'delaySec\' - {"missingProperty":"delaySec"}');
            done();
          });
      });

      it('Error Returned', function (done) {
        const data = {
          payload: {
            b: 'bat'
          },
          delaySec: 60
        };

        const stub = sinon.stub(scheduler, 'AddFutureJob').callsFake(function (queue, name, payload, delay, cb) {
          return setImmediate(cb, new Error('Something Broke'));
        });

        client
          .post('/scheduler/v1/job/future/default')
          .set('Content-Type', 'application/json')
          .send(data)
          .expect(500)
          .end(function (err, res) {
            assert.isNull(err);
            assert.isNotNull(res.body.id);
            assert.equal(res.body.message, 'Request Errored');
            assert.equal(res.body.error, 'Something Broke');
            assert.isTrue(stub.calledOnce);
            done();
          });
      });
    });

    describe('Repeating', function () {
      afterEach(function () {
        sinon.restore();
      });

      describe('Add Job', function () {
        it('Add Job Successfully', function (done) {
          const data = {
            payload: {
              b: 'bat'
            },
            uniqueName: 'test1',
            intervalMinutes: 5
          };

          const stub = sinon.stub(scheduler, 'AddRepeatingJob').callsFake(function (queue, name, payload, interval, cb) {
            assert.equal(queue, 'default');
            assert.equal(name, 'test1');
            assert.deepEqual(payload, data.payload);
            assert.equal(interval, 5);
            return setImmediate(cb, null, '*/5 * * * *');
          });

          client
            .post('/scheduler/v1/job/repeating/default')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(200)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isNotNull(res.body.id);
              assert.equal(res.body.message, 'Request Successful');
              assert.equal(res.body.schedule, '*/5 * * * *');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });

        it('Failed with bad queue', function (done) {
          const data = {
            uniqueName: 'test1',
            intervalMinutes: 5
          };

          client
            .post('/scheduler/v1/job/repeating/doesNotExist')
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
            .post('/scheduler/v1/job/repeating/default')
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
            .post('/scheduler/v1/job/repeating/default')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(400)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isNotNull(res.body.id);
              assert.equal(res.body.message, 'Request Failed');
              assert.equal(res.body.error, ' should NOT have additional properties - {"additionalProperty":"a"}');
              done();
            });
        });

        it('Failed with bad base schema - no name', function (done) {
          const data = {
          };

          client
            .post('/scheduler/v1/job/repeating/default')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(400)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isNotNull(res.body.id);
              assert.equal(res.body.message, 'Request Failed');
              assert.equal(res.body.error, ' should have required property \'uniqueName\' - {"missingProperty":"uniqueName"}');
              done();
            });
        });

        it('Failed with bad base schema - no interval', function (done) {
          const data = {
            uniqueName: 'test1'
          };

          client
            .post('/scheduler/v1/job/repeating/default')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(400)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isNotNull(res.body.id);
              assert.equal(res.body.message, 'Request Failed');
              assert.equal(res.body.error, ' should have required property \'intervalMinutes\' - {"missingProperty":"intervalMinutes"}');
              done();
            });
        });

        it('Error Returned', function (done) {
          const data = {
            payload: {
              b: 'bat'
            },
            uniqueName: 'test1',
            intervalMinutes: 5
          };

          const stub = sinon.stub(scheduler, 'AddRepeatingJob').callsFake(function (queue, name, payload, interval, cb) {
            return setImmediate(cb, new Error('Something Broke'));
          });

          client
            .post('/scheduler/v1/job/repeating/default')
            .set('Content-Type', 'application/json')
            .send(data)
            .expect(500)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isNotNull(res.body.id);
              assert.equal(res.body.message, 'Request Errored');
              assert.equal(res.body.error, 'Something Broke');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });
      });

      describe('Get Jobs', function () {
        it('Gets All Jobs', function (done) {
          const jobs = [{ id: 'test1', data: { a: 'apple' } }];

          const stub = sinon.stub(scheduler, 'GetRepeatingJobs').callsFake(function (queue, cb) {
            assert.equal(queue, 'default');
            return setImmediate(cb, null, jobs);
          });

          client
            .get('/scheduler/v1/job/repeating/default')
            .expect(200)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isObject(res.body);
              assert.equal(res.body.message, 'Request Successful');
              assert.isArray(res.body.jobList);
              assert.deepEqual(res.body.jobList, jobs);
              assert.isTrue(stub.calledOnce);
              done();
            });
        });

        it('Gets All Jobs Errors', function (done) {
          const stub = sinon.stub(scheduler, 'GetRepeatingJobs').callsFake(function (queue, cb) {
            return setImmediate(cb, new Error('Something Broke'));
          });

          client
            .get('/scheduler/v1/job/repeating/default')
            .expect(500)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isObject(res.body);
              assert.equal(res.body.message, 'Request Errored');
              assert.equal(res.body.error, 'Something Broke');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });
      });

      describe('Delete Job', function () {
        it('Success', function (done) {
          const stub = sinon.stub(scheduler, 'DeleteRepeatingJob').callsFake(function (queue, name, cb) {
            assert.equal(queue, 'default');
            assert.equal(name, 'test1');
            return setImmediate(cb);
          });

          client
            .delete('/scheduler/v1/job/repeating/default/test1')
            .expect(200)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isObject(res.body);
              assert.equal(res.body.message, 'Request Successful');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });

        it('Failed', function (done) {
          const stub = sinon.stub(scheduler, 'DeleteRepeatingJob').callsFake(function (queue, name, cb) {
            return setImmediate(cb, new EnhancedError('Job Not Found', true));
          });

          client
            .delete('/scheduler/v1/job/repeating/default/test1')
            .expect(400)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isObject(res.body);
              assert.equal(res.body.message, 'Request Failed');
              assert.equal(res.body.error, 'Job Not Found');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });

        it('Error', function (done) {
          const stub = sinon.stub(scheduler, 'DeleteRepeatingJob').callsFake(function (queue, name, cb) {
            return setImmediate(cb, new Error('Something Broke'));
          });

          client
            .delete('/scheduler/v1/job/repeating/default/test1')
            .expect(500)
            .end(function (err, res) {
              assert.isNull(err);
              assert.isObject(res.body);
              assert.equal(res.body.message, 'Request Errored');
              assert.equal(res.body.error, 'Something Broke');
              assert.isTrue(stub.calledOnce);
              done();
            });
        });
      });
    });
  });
});
