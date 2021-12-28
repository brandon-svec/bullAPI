process.env.NODE_ENV = 'test';
process.env.NODE_CONFIG_DIR = './config/';

const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const scheduler = require(path.resolve('lib', 'scheduler'));
const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));

const ajv = new Ajv({ useDefaults: true });

describe('Scheduler', function(){
    describe('Initialization', function(){
        
    })
})