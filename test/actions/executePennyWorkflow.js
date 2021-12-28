process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const path = require('path');
const nock = require('nock');

const client = require(path.resolve('lib', 'actions', 'executePennyWorkflow'));

describe('Action - Execute Penny Workflow', function () {
  describe('Execute', function () {
    it('Successfully Posts', function (done) {
      let inputParams = {
        a: 'apple'
      };

      nock('https://prom-penny-test.herokuapp.com:443', { 'encodedQueryParams': true })
        .get('/penny/v1/workflow/execute')
        .query({ 'name': 'testName', 'a': 'apple' })
        .reply(200, {
          message: 'Request Successful',
          results: {
            tasks: {

            }
          }
        });

      client.Execute('testName', inputParams, function (err, results) {
        assert.isNull(err);
        assert.isObject(results);
        done();
      });
    });

    it('Throws Error', function (done) {
      let inputParams = {
        a: 'apple'
      };

      nock('https://prom-penny-test.herokuapp.com:443', { 'encodedQueryParams': true })
        .get('/penny/v1/workflow/execute')
        .query({ 'name': 'testName', 'a': 'apple' })
        .replyWithError('Something Broke');

      client.Execute('testName', inputParams, function (err, results) {
        assert.isNotNull(err);
        assert.equal(err.message, 'Something Broke');
        done();
      });
    });

    it('Fails 400', function (done) {
      let inputParams = {
        a: 'apple'
      };

      nock('https://prom-penny-test.herokuapp.com:443', { 'encodedQueryParams': true })
        .get('/penny/v1/workflow/execute')
        .query({ 'name': 'testName', 'a': 'apple' })
        .reply(400, {
          message: 'Request Failed',
          error: 'Not Correct'
        });

      client.Execute('testName', inputParams, function (err, results) {
        assert.isNotNull(err);
        assert.equal(err.message, '[StatusCode: 400] {"message":"Request Failed","error":"Not Correct"}');
        done();
      });
    });

    it('Fails 500', function (done) {
      let inputParams = {
        a: 'apple'
      };

      nock('https://prom-penny-test.herokuapp.com:443', { 'encodedQueryParams': true })
        .get('/penny/v1/workflow/execute')
        .query({ 'name': 'testName', 'a': 'apple' })
        .reply(500, {
          message: 'Request Errored',
          error: 'Something Broke'
        });

      client.Execute('testName', inputParams, function (err, results) {
        assert.isNotNull(err);
        assert.equal(err.message, '[StatusCode: 500] {"message":"Request Errored","error":"Something Broke"}');
        done();
      });
    });
  });
});
