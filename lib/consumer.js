const bull = require('bull');
const config = require('config');
const path = require('path');

const redis = require(path.resolve('lib', 'redis'));
const queues = {};

module.exports = {
  Init
};

function Init (cb) {
  initQueue('default');
  return cb();
}

function initQueue (queue) {
  if (queues[queue]) {
    return;
  }

  const q = new bull(queue, {
    redis: redis.GetConfig(),
    prefix: config.get('name')
  });

  q.process(processWork);

  queues[queue] = q;
}

function processWork (data, cb) {
  data.data.processDate = new Date();
  console.log(data.data);
  return cb();
}
