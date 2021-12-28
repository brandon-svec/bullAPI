process.env.NODE_ENV = 'integrationTest';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const consumer = require(path.resolve('lib', 'consumer'));
const defaultQueue = require(path.resolve('lib', 'consumers', 'default'));
const scheduler = require(path.resolve('lib', 'scheduler'));

const files = fs.readdirSync(path.resolve('lib', 'consumers'));

describe('Consumer Integration Test', function () {
  before(function (done) {
    return consumer.Init(done);
  });

  before(function (done) {
    return scheduler.Init(done);
  });
/*
    describe('Process Default', function(){
        it('Processes Default Queue Successfully', function(done){
            let stub = sinon.stub(defaultQueue, 'ProcessWork').callsFake(function(jobObject, cb){
                console.log(jobObject.data);
                return cb();
            })

            let spy = sinon.spy(consumer, 'ProcessWorkHandler')

            scheduler.AddSingleJob('default', 'test', {}, function(err){
                assert.isNull(err);
            })

        })
    }) */
});
