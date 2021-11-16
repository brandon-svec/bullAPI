const bull = require('bull');
const path = require('path');
const Redis = require('ioredis');

// const queue = require(path.resolve('lib', 'queue'));

const q = new bull('default', {
  redis: {
    port: 6380
  }
});

const q2 = new bull('default', {
  redis: {
    port: 6380
  },
  prefix: 'jobScheduler'
});

q2.process('*', function (data, cb) {
  console.log('test');
  console.log(data.data);
  cb();
});
