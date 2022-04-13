process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const Ajv = require('ajv');
const assert = require('chai').assert;
const path = require('path');

const ajv = new Ajv({ useDefaults: true });

const client = require(path.resolve('lib', 'consumers', 'default'));

describe('Consumer - default.js', function () {
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
					data: {
						payload: {
							a: 'apple'
						}
					}
				};

				client.ProcessWork(jobObject, function (err, results) {
					assert.isNull(err);
					assert.isObject(results);
					assert.deepEqual(jobObject.data, results);
					return done();
				});
			});
		});

		describe('Sad Path', function () {
			it('Bad Payload', function (done) {
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
		});
	});
});
