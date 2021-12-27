process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const Ajv = require('ajv');
const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const queueFactory = require(path.resolve('lib', 'queueFactory'));

const ajv = new Ajv({ useDefaults: true });

const files = fs.readdirSync(path.resolve('lib', 'consumers'));

describe('Consumer Get Schema', function () {
  before(function () {
    sinon.stub(queueFactory, 'Init').callsFake(function (cb) {
      return cb();
    });
  });

  after(function () {
    return sinon.restore();
  });

  files.forEach(function (file) {
    describe(file, function () {
      const client = require(path.resolve('lib', 'consumers', file));
      it('Checks Schema', function (done) {
        assert.isTrue(ajv.validateSchema(client.GetSchema()));
        done();
      });
    });
  });
});
