const async = require('async');
const bull = require('bull');
const config = require('config');
const path = require('path');
const pino = require('pino');

const cronGenerator = require(path.resolve('lib', 'cronGenerator'));
const redis = require(path.resolve('lib', 'redis'));
let redisClient;

const log = pino(config.get('logging'));

const queues = {};

module.exports = {
  AddSingleJob,
  AddFutureJob,
  AddRepeatingJob,
  Init
};

function AddSingleJob (queue, name, data, cb) {
  if (!queue) {
    queue = 'default';
  }

  let options = {
    jobId: name
  };

  queueJob(queue, data, options, function (err, state) {
    if (err) {
      log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name }, 'Add Single Job Failed');
      return cb(err);
    }

    log.info({ Queue: queue, JobId: name }, 'Add Single Job Success');
    return cb();
  });
}

function AddFutureJob (queue, name, data, delay, cb) {
  if (!queue) {
    queue = 'default';
  }

  let options = {
    jobId: name,
    delay: delay * 1000
  };

  queueJob(queue, data, options, function (err, state) {
    if (err) {
      log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name, DelaySeconds: delay }, 'Add Future Job Failed');
      return cb(err);
    }

    log.info({ Queue: queue, JobId: name }, 'Add Future Job Success');
    return cb();
  });
}

function AddRepeatingJob (queue, name, data, interval, cb) {
  if (!queue) {
    queue = 'default';
  }

  let cron = cronGenerator.GetCronSchedule(queue, interval, function (err, cron) {
    if (err) {
      return cb(err);
    }

    console.log(cron);

    let options = {
      jobId: name,
      repeat: {
        cron
      }
    };

    queueJob(queue, data, options, function (err, state) {
      if (err) {
        log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name }, 'Add Repeating Job Failed');
        return cb(err);
      }

      log.info({ Queue: queue, JobId: name, Scheduler: cron }, 'Add Repeating Job Success');
      return cb(null, cron);
    });
  });
}

function queueJob (queue, data, options, cb) {
  let envelope = {
    createdDate: new Date(),
    data,
    name: options.jobId
  };

  options.removeOnComplete = true;

  async.waterfall([
    checkQueue,
    addJob
  ], cb);

  function checkQueue (cb) {
    return initQueue(queue, cb);
  }

  function addJob (cb) {
    return queues[queue].add(envelope, options).then(function () {
      return cb();
    }).catch(function (err) {
      return cb(err);
    });
  }
}

function Init (cb) {
  redis.GetClient(function (err, client) {
    if (err) {
      return cb(err);
    }

    redisClient = client;
    return initQueue('default', cb);
  });
}

function initQueue (queue, cb) {
  if (queues[queue]) {
    return setImmediate(cb);
  }

  queues[queue] = new bull(queue, {
    createClient: function () {
      return redisClient;
    },
    prefix: config.get('name')
  });

  return setImmediate(cb);
}
